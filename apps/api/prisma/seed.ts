import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  const products = [
    {
      id: "wave-lamp",
      slug: "wave-lamp",
      name: "Wave Lamp",
      description:
        "Flowing sculptural lines create a soft ambient glow for thoughtful spaces.",
      pricePaise: 249900,
      imageUrl: "/images/wave-lamp.jpg",
      stock: 20,
    },
    {
      id: "geometric-lamp",
      slug: "geometric-lamp",
      name: "Geometric Lamp",
      description:
        "A tactile geometric pattern turns a simple light into a distinctive accent.",
      pricePaise: 249900,
      imageUrl: "/images/geometric-lamp.jpg",
      stock: 20,
    },
  ];
  for (const product of products) {
    const { stock, ...catalogFields } = product;
    await prisma.product.upsert({
      where: { id: product.id },
      update: catalogFields,
      create: product,
    });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword && adminPassword.length >= 14) {
    const existing = await prisma.user.findUnique({
      where: { email: adminEmail },
    });
    if (!existing) {
      await prisma.user.create({
        data: {
          name: "Itsuki Studio Admin",
          email: adminEmail,
          passwordHash: await bcrypt.hash(adminPassword, 12),
          role: "ADMIN",
        },
      });
    } else if (existing.role !== "ADMIN") {
      await prisma.user.update({
        where: { email: adminEmail },
        data: { role: "ADMIN" },
      });
    }
  }
}
main().finally(() => prisma.$disconnect());
