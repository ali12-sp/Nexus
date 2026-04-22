import { z } from "zod";

const profileBody = z.object({
  fullName: z.string().min(2).max(120).optional(),
  bio: z.string().max(1000).optional().nullable(),
  profileImage: z.string().url().optional().nullable(),
  location: z.string().max(120).optional().nullable(),
  website: z.string().url().optional().nullable(),
  preferences: z.record(z.any()).optional().nullable(),
  startupName: z.string().max(120).optional().nullable(),
  startupStage: z.string().max(120).optional().nullable(),
  industry: z.string().max(120).optional().nullable(),
  pitchSummary: z.string().max(2000).optional().nullable(),
  fundingNeeded: z.coerce.number().nonnegative().optional().nullable(),
  previousFunding: z.string().max(255).optional().nullable(),
  firmName: z.string().max(120).optional().nullable(),
  investmentFocus: z.string().max(1000).optional().nullable(),
  ticketSizeMin: z.coerce.number().nonnegative().optional().nullable(),
  ticketSizeMax: z.coerce.number().nonnegative().optional().nullable(),
  portfolioHistory: z.string().max(2000).optional().nullable(),
  preferredIndustries: z.array(z.string().max(120)).optional(),
  twoFactorEnabled: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  body: profileBody.refine(
    (value) =>
      value.ticketSizeMin === undefined ||
      value.ticketSizeMin === null ||
      value.ticketSizeMax === undefined ||
      value.ticketSizeMax === null ||
      value.ticketSizeMin <= value.ticketSizeMax,
    {
      message: "ticketSizeMin must be less than or equal to ticketSizeMax",
      path: ["ticketSizeMin"],
    },
  ),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const userIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().cuid(),
  }),
});
