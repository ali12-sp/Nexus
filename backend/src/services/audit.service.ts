import { Prisma } from "../../generated/prisma-client/index.js";

import { prisma } from "../lib/prisma.js";

type CreateAuditLogInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown>;
  status?: "SUCCESS" | "FAILURE";
  userAgent?: string | null;
  userId?: string | null;
};

export const createAuditLog = async ({
  action,
  entityType,
  entityId,
  ipAddress,
  metadata,
  status = "SUCCESS",
  userAgent,
  userId,
}: CreateAuditLogInput) =>
  prisma.auditLog.create({
    data: {
      action,
      entityType,
      entityId: entityId ?? undefined,
      ipAddress: ipAddress ?? undefined,
      metadata: metadata as Prisma.InputJsonValue | undefined,
      status,
      userAgent: userAgent ?? undefined,
      userId: userId ?? undefined,
    },
  });

export const listAuditLogsForUser = async (userId: string, limit = 20) =>
  prisma.auditLog.findMany({
    where: { userId },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
