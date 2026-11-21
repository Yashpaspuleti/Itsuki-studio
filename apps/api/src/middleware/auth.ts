import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../lib/env.js";
import { prisma } from "../lib/prisma.js";

export type AuthRequest = Request & {
  user?: { id: string; role: "CUSTOMER" | "ADMIN" };
};

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ")
    ? header.slice(7)
    : req.cookies?.itsuki_session;
  if (!token)
    return res.status(401).json({ message: "Please sign in to continue." });
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: "itsuki-studio",
    }) as { sub: string };
    req.user = { id: payload.sub, role: "CUSTOMER" };
    next();
  } catch {
    return res
      .status(401)
      .json({ message: "Your session has expired. Please sign in again." });
  }
}

export async function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user?.id)
      return res.status(401).json({ message: "Please sign in." });
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { role: true },
    });
    if (!user || user.role !== "ADMIN")
      return res
        .status(403)
        .json({ message: "Administrator access required." });
    req.user.role = "ADMIN";
    next();
  } catch (error) {
    next(error);
  }
}
