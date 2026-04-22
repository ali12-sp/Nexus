import { z } from "zod";

const paymentBody = z.object({
  amount: z.coerce.number().positive().max(1000000),
  currency: z.string().length(3).default("USD"),
  note: z.string().max(300).optional().nullable(),
});

export const depositSchema = z.object({
  body: paymentBody,
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const withdrawSchema = z.object({
  body: paymentBody,
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const transferSchema = z.object({
  body: paymentBody.extend({
    recipientUserId: z.string().cuid(),
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});
