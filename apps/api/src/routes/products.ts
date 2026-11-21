import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const productsRouter = Router();
const publicProduct = {
  id: true,
  slug: true,
  name: true,
  description: true,
  pricePaise: true,
  imageUrl: true,
  stock: true,
} as const;

productsRouter.get("/", async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      select: publicProduct,
    });
    return res.json({ products });
  } catch (error) {
    next(error);
  }
});

productsRouter.get("/:slug", async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({
      where: { slug: req.params.slug, active: true },
      select: publicProduct,
    });
    return product
      ? res.json({ product })
      : res.status(404).json({ message: "Product not found." });
  } catch (error) {
    next(error);
  }
});
