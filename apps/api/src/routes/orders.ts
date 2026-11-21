import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

export const ordersRouter = Router();
ordersRouter.use(requireAuth);

ordersRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: { select: { name: true, imageUrl: true, slug: true } },
          },
        },
      },
    });
    return res.json({ orders });
  } catch (error) {
    next(error);
  }
});

ordersRouter.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const orderId = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user!.id },
      include: {
        items: {
          include: {
            product: { select: { name: true, imageUrl: true, slug: true } },
          },
        },
      },
    });
    return order
      ? res.json({ order })
      : res.status(404).json({ message: "Order not found." });
  } catch (error) {
    next(error);
  }
});
