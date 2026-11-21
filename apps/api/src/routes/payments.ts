import { Router } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { env } from "../lib/env.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";
import { getRazorpayClient } from "../services/razorpay.js";

export const paymentRouter = Router();
const orderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(5),
      }),
    )
    .min(1)
    .max(10),
  shipping: z.object({
    name: z.string().min(2).max(80),
    phone: z.string().min(8).max(25),
    line1: z.string().min(4).max(255),
    line2: z.string().max(255).optional(),
    city: z.string().min(2).max(100),
    state: z.string().min(2).max(100),
    postalCode: z.string().min(5).max(12),
  }),
});

async function markOrderPaid(orderId: string, paymentId: string) {
  await prisma.$transaction(async (tx) => {
    const changed = await tx.order.updateMany({
      where: { id: orderId, status: { in: ["PENDING", "FAILED"] } },
      data: { status: "PAID", razorpayPaymentId: paymentId },
    });
    if (changed.count !== 1) return;
    const items = await tx.orderItem.findMany({ where: { orderId } });
    for (const item of items) {
      const stock = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (stock.count !== 1)
        throw new Error(
          "Payment succeeded, but stock reconciliation needs administrator attention.",
        );
    }
  });
}

const safeEqual = (a: string, b: string) => {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
};

paymentRouter.post(
  "/razorpay/order",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const { items, shipping } = orderSchema.parse(req.body);
      const aggregated = [
        ...items.reduce(
          (map, item) =>
            map.set(
              item.productId,
              (map.get(item.productId) ?? 0) + item.quantity,
            ),
          new Map<string, number>(),
        ),
      ].map(([productId, quantity]) => ({ productId, quantity }));
      if (aggregated.some((item) => item.quantity > 5))
        return res
          .status(400)
          .json({ message: "Maximum quantity per product is five." });

      const products = await prisma.product.findMany({
        where: {
          id: { in: aggregated.map((item) => item.productId) },
          active: true,
        },
      });
      if (products.length !== aggregated.length)
        return res
          .status(400)
          .json({ message: "One or more products are unavailable." });
      const productMap = new Map(
        products.map((product) => [product.id, product]),
      );
      const lineItems = aggregated.map((item) => {
        const product = productMap.get(item.productId)!;
        if (product.stock < item.quantity)
          throw new Error(`${product.name} does not have enough stock.`);
        return {
          productId: product.id,
          quantity: item.quantity,
          unitPricePaise: product.pricePaise,
        };
      });
      const totalPaise = lineItems.reduce(
        (sum, item) => sum + item.unitPricePaise * item.quantity,
        0,
      );

      const order = await prisma.order.create({
        data: {
          userId: req.user!.id,
          totalPaise,
          shippingName: shipping.name,
          shippingPhone: shipping.phone,
          shippingLine1: shipping.line1,
          shippingLine2: shipping.line2,
          shippingCity: shipping.city,
          shippingState: shipping.state,
          shippingPostalCode: shipping.postalCode,
          items: { create: lineItems },
        },
      });
      const razorpayOrder = await getRazorpayClient().orders.create({
        amount: totalPaise,
        currency: "INR",
        receipt: order.id,
        notes: { internalOrderId: order.id },
      });
      await prisma.order.update({
        where: { id: order.id },
        data: { razorpayOrderId: razorpayOrder.id },
      });
      return res
        .status(201)
        .json({
          orderId: order.id,
          razorpayOrderId: razorpayOrder.id,
          amount: totalPaise,
          currency: "INR",
          keyId: env.RAZORPAY_KEY_ID,
        });
    } catch (error) {
      next(error);
    }
  },
);

paymentRouter.post(
  "/razorpay/verify",
  requireAuth,
  async (req: AuthRequest, res, next) => {
    try {
      const input = z
        .object({
          razorpay_order_id: z.string(),
          razorpay_payment_id: z.string(),
          razorpay_signature: z.string(),
        })
        .parse(req.body);
      const order = await prisma.order.findFirst({
        where: {
          razorpayOrderId: input.razorpay_order_id,
          userId: req.user!.id,
        },
      });
      if (!order) return res.status(404).json({ message: "Order not found." });
      if (!env.RAZORPAY_KEY_SECRET)
        return res
          .status(503)
          .json({ message: "Payment verification is unavailable." });
      const expected = createHmac("sha256", env.RAZORPAY_KEY_SECRET)
        .update(`${input.razorpay_order_id}|${input.razorpay_payment_id}`)
        .digest("hex");
      if (!safeEqual(expected, input.razorpay_signature))
        return res
          .status(400)
          .json({ message: "Payment signature could not be verified." });
      const payment = await getRazorpayClient().payments.fetch(
        input.razorpay_payment_id,
      );
      if (
        payment.order_id !== input.razorpay_order_id ||
        payment.amount !== order.totalPaise ||
        payment.currency !== "INR" ||
        payment.status !== "captured"
      )
        return res
          .status(409)
          .json({ message: "Payment is not captured for this order yet." });
      await markOrderPaid(order.id, input.razorpay_payment_id);
      return res.json({
        success: true,
        orderId: order.id,
        message: "Payment verified.",
      });
    } catch (error) {
      next(error);
    }
  },
);

// Mount this route with express.raw({ type: 'application/json' }) before express.json().
paymentRouter.post("/razorpay/webhook", async (req, res, next) => {
  try {
    if (!env.RAZORPAY_WEBHOOK_SECRET)
      return res.status(503).json({ message: "Webhook is not configured." });
    const signature = req.header("x-razorpay-signature") ?? "";
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
    const expected = createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex");
    if (!safeEqual(expected, signature))
      return res.status(400).json({ message: "Invalid webhook signature." });
    const event = JSON.parse(rawBody.toString("utf8")) as {
      id?: string;
      event?: string;
      payload?: { payment?: { entity?: { order_id?: string; id?: string } } };
    };
    if (!event.id || !event.event)
      return res.status(400).json({ message: "Malformed webhook event." });
    const payment = event.payload?.payment?.entity;
    const order = payment?.order_id
      ? await prisma.order.findUnique({
          where: { razorpayOrderId: payment.order_id },
        })
      : null;
    await prisma.paymentEvent
      .create({
        data: {
          provider: "razorpay",
          providerEventId: event.id,
          eventType: event.event,
          orderId: order?.id,
        },
      })
      .catch((error: { code?: string }) => {
        if (error.code !== "P2002") throw error;
      });
    if (order && event.event === "payment.captured" && payment?.id)
      await markOrderPaid(order.id, payment.id);
    else if (order && event.event === "payment.failed")
      await prisma.order.updateMany({
        where: { id: order.id, status: "PENDING" },
        data: { status: "FAILED" },
      });
    return res.json({ received: true });
  } catch (error) {
    next(error);
  }
});
