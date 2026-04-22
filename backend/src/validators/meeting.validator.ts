import { z } from "zod";

export const createMeetingSchema = z.object({
  body: z.object({
    inviteeId: z.string().cuid(),
    title: z.string().min(3).max(160),
    agenda: z.string().max(1500).optional().nullable(),
    notes: z.string().max(1500).optional().nullable(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    timezone: z.string().min(2).max(60),
  }).refine((value) => value.endTime > value.startTime, {
    message: "endTime must be after startTime",
    path: ["endTime"],
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const meetingIdParamSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const respondMeetingSchema = z.object({
  body: z.object({
    status: z.enum(["ACCEPTED", "REJECTED"]),
    notes: z.string().max(1500).optional().nullable(),
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const cancelMeetingSchema = z.object({
  body: z.object({
    notes: z.string().max(1500).optional().nullable(),
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.string().cuid(),
  }),
});
