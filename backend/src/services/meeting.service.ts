import { StatusCodes } from "http-status-codes";
import { v4 as uuid } from "uuid";

import { prisma } from "../lib/prisma.js";
import { createNotification } from "./notification.service.js";
import { AppError } from "../utils/appError.js";

type MeetingStatusValue =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

const ACTIVE_STATUSES: MeetingStatusValue[] = ["PENDING", "ACCEPTED"];

export const assertNoMeetingConflict = async ({
  userIds,
  startTime,
  endTime,
  excludeMeetingId,
}: {
  userIds: string[];
  startTime: Date;
  endTime: Date;
  excludeMeetingId?: string;
}) => {
  const conflict = await prisma.meeting.findFirst({
    where: {
      status: {
        in: ACTIVE_STATUSES,
      },
      id: excludeMeetingId
        ? {
            not: excludeMeetingId,
          }
        : undefined,
      OR: [
        {
          organizerId: {
            in: userIds,
          },
        },
        {
          inviteeId: {
            in: userIds,
          },
        },
      ],
      startTime: {
        lt: endTime,
      },
      endTime: {
        gt: startTime,
      },
    },
  });

  if (conflict) {
    throw new AppError(
      "Meeting time conflicts with an existing booking",
      StatusCodes.CONFLICT,
    );
  }
};

export const createMeeting = async ({
  organizerId,
  inviteeId,
  title,
  agenda,
  notes,
  startTime,
  endTime,
  timezone,
}: {
  organizerId: string;
  inviteeId: string;
  title: string;
  agenda?: string | null;
  notes?: string | null;
  startTime: Date;
  endTime: Date;
  timezone: string;
}) => {
  if (organizerId === inviteeId) {
    throw new AppError("You cannot schedule a meeting with yourself", StatusCodes.BAD_REQUEST);
  }

  await assertNoMeetingConflict({
    userIds: [organizerId, inviteeId],
    startTime,
    endTime,
  });

  const meeting = await prisma.meeting.create({
    data: {
      organizerId,
      inviteeId,
      title,
      agenda,
      notes,
      startTime,
      endTime,
      timezone,
      roomId: uuid(),
    },
    include: {
      organizer: true,
      invitee: true,
    },
  });

  await createNotification({
    userId: inviteeId,
    type: "MEETING",
    title: "New meeting request",
    message: `${meeting.organizer.fullName} invited you to "${title}".`,
    metadata: {
      meetingId: meeting.id,
    },
  });

  return meeting;
};

export const respondToMeeting = async ({
  meetingId,
  responderId,
  status,
  notes,
}: {
  meetingId: string;
  responderId: string;
  status: "ACCEPTED" | "REJECTED";
  notes?: string | null;
}) => {
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

  if (meeting.inviteeId !== responderId) {
    throw new AppError("Only the invited user can respond to this meeting", StatusCodes.FORBIDDEN);
  }

  if (status === "ACCEPTED") {
    await assertNoMeetingConflict({
      userIds: [meeting.organizerId, meeting.inviteeId],
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      excludeMeetingId: meeting.id,
    });
  }

  const updatedMeeting = await prisma.meeting.update({
    where: { id: meeting.id },
    data: {
      status,
      notes: notes ?? meeting.notes,
    },
    include: {
      organizer: true,
      invitee: true,
    },
  });

  await createNotification({
    userId: meeting.organizerId,
    type: "MEETING",
    title: `Meeting ${status.toLowerCase()}`,
    message: `${meeting.invitee.fullName} ${status === "ACCEPTED" ? "accepted" : "rejected"} your meeting request.`,
    metadata: {
      meetingId: meeting.id,
    },
  });

  return updatedMeeting;
};

export const cancelMeeting = async ({
  meetingId,
  requesterId,
  notes,
}: {
  meetingId: string;
  requesterId: string;
  notes?: string | null;
}) => {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
  });

  if (!meeting) {
    throw new AppError("Meeting not found", StatusCodes.NOT_FOUND);
  }

  if (![meeting.organizerId, meeting.inviteeId].includes(requesterId)) {
    throw new AppError("You cannot cancel this meeting", StatusCodes.FORBIDDEN);
  }

  const updatedMeeting = await prisma.meeting.update({
    where: { id: meeting.id },
    data: {
      status: "CANCELLED",
      notes: notes ?? meeting.notes,
    },
    include: {
      organizer: true,
      invitee: true,
    },
  });

  const recipientId = requesterId === meeting.organizerId ? meeting.inviteeId : meeting.organizerId;

  await createNotification({
    userId: recipientId,
    type: "MEETING",
    title: "Meeting cancelled",
    message: `A scheduled meeting "${meeting.title}" was cancelled.`,
    metadata: {
      meetingId: meeting.id,
    },
  });

  return updatedMeeting;
};
