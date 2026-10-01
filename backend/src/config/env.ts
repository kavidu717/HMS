import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("5000"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("1d")
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error(result.error.format());
  process.exit(1);
}

export const env = result.data;