import { Request, Response } from "express";

import { prisma } from "../lib/prisma.js";
import { sendSuccess } from "../utils/apiResponse.js";
import {
  serializeDocument,
  serializeMeeting,
  serializeNotification,
  serializeTransaction,
  serializeUser,
} from "../utils/serializers.js";

export const getDashboardSummary = async (req: Request, res: Response) => {
  const user = req.user!;
  const now = new Date();

  const [upcomingMeetings, recentDocuments, recentTransactions, notifications, suggestedUsers] =
    await Promise.all([
      prisma.meeting.findMany({
        where: {
          OR: [{ organizerId: user.id }, { inviteeId: user.id }],
          startTime: {
            gte: now,
          },
        },
        include: {
          organizer: true,
          invitee: true,
        },
        orderBy: {
          startTime: "asc",
        },
        take: 5,
      }),
      prisma.document.findMany({
        where: {
          OR: [
            { uploadedById: user.id },
            {
              relatedMeeting: {
                OR: [{ organizerId: user.id }, { inviteeId: user.id }],
              },
            },
          ],
        },
        include: {
          uploadedBy: true,
          signatures: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 5,
      }),
      prisma.transaction.findMany({
        where: {
          OR: [{ userId: user.id }, { recipientUserId: user.id }],
        },
        include: {
          recipientUser: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
      prisma.notification.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),
      prisma.user.findMany({
        where: {
          role: user.role === "INVESTOR" ? "ENTREPRENEUR" : "INVESTOR",
        },
        take: 4,
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

  const summary = {
    profile: serializeUser(user),
    stats: {
      walletBalance: Number(user.walletBalance),
      upcomingMeetingCount: upcomingMeetings.length,
      documentCount: recentDocuments.length,
      recentTransactionCount: recentTransactions.length,
    },
    upcomingMeetings: upcomingMeetings.map(serializeMeeting),
    recentDocuments: recentDocuments.map(serializeDocument),
    recentTransactions: recentTransactions.map(serializeTransaction),
    notifications: notifications.map(serializeNotification),
    suggestedUsers: suggestedUsers.map(serializeUser),
  };

  return sendSuccess(res, summary, "Dashboard summary fetched successfully");
};
