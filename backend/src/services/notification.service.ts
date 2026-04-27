import { Prisma } from "../../generated/prisma-client/index.js";

import { prisma } from "../lib/prisma.js";

type NotificationTypeValue = "MEETING" | "DOCUMENT" | "PAYMENT" | "SECURITY" | "SYSTEM";

type CreateNotificationInput = {
  userId: string;
  title: string;
  message: string;
  type?: NotificationTypeValue;
  metadata?: Record<string, unknown>;
};

export const createNotification = async ({
  userId,
  title,
  message,
  type = "SYSTEM",
  metadata,
}: CreateNotificationInput) => {
  return prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      metadata: metadata as Prisma.InputJsonValue | undefined,
    },
  });
};

export const listNotificationsForUser = async (userId: string) =>
  prisma.notification.findMany({
    where: { userId },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });
