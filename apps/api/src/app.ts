import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { ZodError } from "zod";
import { env } from "./lib/env.js";
import { authRouter } from "./routes/auth.js";
import { productsRouter } from "./routes/products.js";
import { paymentRouter } from "./routes/payments.js";
import { ordersRouter } from "./routes/orders.js";
import { adminRouter } from "./routes/admin.js";
import cookieParser from "cookie-parser";

export const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: env.WEB_ORIGIN, credentials: true }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 200,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);
app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", service: "itsuki-studio-api" }),
);
app.use(
  "/api/payments/razorpay/webhook",
  express.raw({ type: "application/json" }),
);
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/admin", adminRouter);
app.use((_req, res) =>
  res.status(404).json({ message: "Resource not found." }),
);
app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (error instanceof ZodError)
      return res
        .status(400)
        .json({
          message: "Please check the information you entered.",
          issues: error.issues,
        });
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";
    const status = message.includes("not have enough stock") ? 409 : 500;
    if (env.NODE_ENV !== "production") console.error(error);
    return res
      .status(status)
      .json({
        message:
          status === 500 && env.NODE_ENV === "production"
            ? "Something went wrong."
            : message,
      });
  },
);
