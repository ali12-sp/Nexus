import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2).max(120),
    email: z.string().email(),
    password: z.string().min(8).max(64),
    role: z.enum(["INVESTOR", "ENTREPRENEUR"]),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(64),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const sendOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    purpose: z.enum(["LOGIN", "SENSITIVE_ACTION"]).default("LOGIN"),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    code: z.string().length(6),
    purpose: z.enum(["LOGIN", "SENSITIVE_ACTION"]).default("LOGIN"),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
