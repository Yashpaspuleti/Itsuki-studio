import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/overview", async (_req, res, next) => {
  try {
    const [products, orders, customers, revenue] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.order.aggregate({
        where: {
          status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
        },
        _sum: { totalPaise: true },
      }),
    ]);
    return res.json({
      products,
      orders,
      customers,
      revenuePaise: revenue._sum.totalPaise ?? 0,
    });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/products", async (_req, res, next) => {
  try {
    return res.json({
      products: await prisma.product.findMany({
        orderBy: { createdAt: "desc" },
      }),
    });
  } catch (error) {
    next(error);
  }
});

const productInput = z.object({
  id: z.string().min(2).max(80),
  slug: z.string().min(2).max(100),
  name: z.string().min(2).max(120),
  description: z.string().min(10),
  pricePaise: z.number().int().positive(),
  imageUrl: z.string().min(1),
  stock: z.number().int().min(0),
  active: z.boolean().default(true),
});

adminRouter.post("/products", async (req, res, next) => {
  try {
    const product = await prisma.product.create({
      data: productInput.parse(req.body),
    });
    return res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/products/:id", async (req, res, next) => {
  try {
    const input = productInput.omit({ id: true }).partial().parse(req.body);
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: input,
    });
    return res.json({ product });
  } catch (error) {
    next(error);
  }
});

adminRouter.get("/orders", async (_req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    });
    return res.json({ orders });
  } catch (error) {
    next(error);
  }
});

adminRouter.patch("/orders/:id/status", async (req, res, next) => {
  try {
    const { status } = z
      .object({ status: z.enum(["PROCESSING", "SHIPPED", "DELIVERED"]) })
      .parse(req.body);
    const current = await prisma.order.findUnique({
      where: { id: req.params.id },
    });
    if (!current) return res.status(404).json({ message: "Order not found." });
    const nextByStatus: Record<string, string[]> = {
      PAID: ["PROCESSING"],
      PROCESSING: ["SHIPPED"],
      SHIPPED: ["DELIVERED"],
    };
    if (!nextByStatus[current.status]?.includes(status))
      return res
        .status(409)
        .json({
          message: `Cannot move an order from ${current.status} to ${status}.`,
        });
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
    });
    return res.json({ order });
  } catch (error) {
    next(error);
  }
});
