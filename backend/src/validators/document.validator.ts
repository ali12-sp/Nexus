import { z } from "zod";

export const updateDocumentSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(160).optional(),
    status: z.enum(["UPLOADED", "UNDER_REVIEW", "SIGNED", "ARCHIVED"]).optional(),
    relatedMeetingId: z.string().cuid().optional().nullable(),
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const signDocumentSchema = z.object({
  body: z.object({
    signerName: z.string().min(2).max(120),
    signatureDataUrl: z.string().min(10),
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const documentIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().cuid(),
  }),
});
