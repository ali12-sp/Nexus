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

export const requestPasswordResetSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(32).max(255),
    password: z.string().min(8).max(64),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(32).max(255),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const auditLogListSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
  params: z.object({}).optional(),
});
