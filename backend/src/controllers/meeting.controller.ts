import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { prisma } from "../lib/prisma.js";
import { cancelMeeting, createMeeting, respondToMeeting } from "../services/meeting.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../utils/appError.js";
import { serializeMeeting } from "../utils/serializers.js";

const getStringValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const createMeetingController = async (req: Request, res: Response) => {
  const meeting = await createMeeting({
    organizerId: req.user!.id,
    ...req.body,
  });

  return sendSuccess(
    res,
    serializeMeeting(meeting),
    "Meeting scheduled successfully",
    StatusCodes.CREATED,
  );
};

export const listMeetingsController = async (req: Request, res: Response) => {
  const status = getStringValue(req.query.status as string | string[] | undefined);

  const meetings = await prisma.meeting.findMany({
    where: {
      OR: [{ organizerId: req.user!.id }, { inviteeId: req.user!.id }],
      status: status ? (status as never) : undefined,
    },
    include: {
      organizer: true,
      invitee: true,
    },
    orderBy: {
      startTime: "asc",
    },
  });

  return sendSuccess(
    res,
    meetings.map(serializeMeeting),
    "Meetings fetched successfully",
  );
};

export const getMeetingController = async (req: Request, res: Response) => {
  const meetingId = getStringValue(req.params.id);

  if (!meetingId) {
    throw new AppError("Meeting id is required", StatusCodes.BAD_REQUEST);
  }

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      organizer: true,
      invitee: true,
    },
  });

  if (!meeting) {
    throw new AppError("Meeting not found", StatusCodes.NOT_FOUND);
  }

  if (![meeting.organizerId, meeting.inviteeId].includes(req.user!.id)) {
    throw new AppError("You do not have access to this meeting", StatusCodes.FORBIDDEN);
  }

  return sendSuccess(res, serializeMeeting(meeting), "Meeting fetched successfully");
};

export const respondMeetingController = async (req: Request, res: Response) => {
  const meetingId = getStringValue(req.params.id);

  if (!meetingId) {
    throw new AppError("Meeting id is required", StatusCodes.BAD_REQUEST);
  }

  const meeting = await respondToMeeting({
    meetingId,
    responderId: req.user!.id,
    ...req.body,
  });

  return sendSuccess(res, serializeMeeting(meeting), "Meeting updated successfully");
};

export const cancelMeetingController = async (req: Request, res: Response) => {
  const meetingId = getStringValue(req.params.id);

  if (!meetingId) {
    throw new AppError("Meeting id is required", StatusCodes.BAD_REQUEST);
  }

  const meeting = await cancelMeeting({
    meetingId,
    requesterId: req.user!.id,
    ...req.body,
  });

  return sendSuccess(res, serializeMeeting(meeting), "Meeting cancelled successfully");
};
