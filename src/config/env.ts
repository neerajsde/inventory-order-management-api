import "dotenv/config";
import z from "zod";

const envSchema = z.object({
  PORT: z.string().default("4000")
});

export const env = envSchema.parse(process.env);