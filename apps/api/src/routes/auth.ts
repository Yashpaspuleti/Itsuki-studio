import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { env } from "../lib/env.js";
import { requireAuth, type AuthRequest } from "../middleware/auth.js";

export const authRouter = Router();
const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(190),
  password: z.string().min(10).max(72),
  phone: z.string().trim().max(25).optional(),
});
const loginSchema = z.object({
  email: z.string().email().max(190),
  password: z.string().min(1).max(72),
});
const createToken = (userId: string) =>
  jwt.sign({}, env.JWT_SECRET, {
    subject: userId,
    expiresIn: "2h",
    issuer: "itsuki-studio",
  });
const publicUser = (user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role?: string;
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role ?? "CUSTOMER",
});
const setSession = (res: import("express").Response, token: string) =>
  res.cookie("itsuki_session", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
    maxAge: 2 * 60 * 60 * 1000,
  });

authRouter.post("/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const email = input.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing)
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: { name: input.name, email, passwordHash, phone: input.phone },
    });
    setSession(res, createToken(user.id));
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash)))
      return res
        .status(401)
        .json({ message: "Email or password is incorrect." });
    setSession(res, createToken(user.id));
    return res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", (_req, res) =>
  res
    .clearCookie("itsuki_session", {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    })
    .json({ success: true }),
);

authRouter.get("/me", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    return user
      ? res.json({ user })
      : res.status(404).json({ message: "Account not found." });
  } catch (error) {
    next(error);
  }
});

authRouter.patch("/me", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const input = z
      .object({
        name: z.string().trim().min(2).max(80),
        phone: z.string().trim().max(25).optional().nullable(),
      })
      .parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: input,
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    return res.json({ user });
  } catch (error) {
    next(error);
  }
});
