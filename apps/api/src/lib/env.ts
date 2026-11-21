import { z } from 'zod';

const developmentSecret = 'local-development-secret-change-before-deploy-12345';
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
});

export const env = envSchema.parse({
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL ?? 'mysql://itsuki:change-me@localhost:3306/itsuki_studio',
  JWT_SECRET: process.env.JWT_SECRET ?? (process.env.NODE_ENV === 'production' ? undefined : developmentSecret),
});
