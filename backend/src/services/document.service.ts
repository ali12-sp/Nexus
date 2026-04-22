import { StatusCodes } from "http-status-codes";

import { prisma } from "../lib/prisma.js";
import { createNotification } from "./notification.service.js";
import { persistSignatureDataUrl } from "./storage/localStorage.service.js";
import { resolveStoredFile } from "./storage/index.js";
import { AppError } from "../utils/appError.js";

export const ensureDocumentAccess = async (documentId: string, userId: string) => {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      relatedMeeting: true,
      uploadedBy: true,
      signatures: true,
    },
  });

  if (!document) {
    throw new AppError("Document not found", StatusCodes.NOT_FOUND);
  }

  const hasMeetingAccess =
    document.relatedMeeting &&
    [document.relatedMeeting.organizerId, document.relatedMeeting.inviteeId].includes(userId);

  if (document.uploadedById !== userId && !hasMeetingAccess) {
    throw new AppError("You do not have access to this document", StatusCodes.FORBIDDEN);
  }

  return document;
};

export const createDocument = async ({
  file,
  userId,
  title,
  relatedMeetingId,
  versionGroupId,
}: {
  file: Express.Multer.File;
  userId: string;
  title: string;
  relatedMeetingId?: string | null;
  versionGroupId?: string | null;
}) => {
  const stored = await resolveStoredFile(file);

  let nextVersion = 1;
  let resolvedVersionGroupId = versionGroupId ?? null;

  if (resolvedVersionGroupId) {
    const lastVersion = await prisma.document.findFirst({
      where: {
        versionGroupId: resolvedVersionGroupId,
      },
      orderBy: {
        version: "desc",
      },
    });

    nextVersion = (lastVersion?.version ?? 0) + 1;
  }

  const document = await prisma.document.create({
    data: {
      title,
      fileUrl: stored.fileUrl,
      fileKey: stored.fileKey,
      fileType: file.mimetype,
      fileSize: file.size,
      uploadedById: userId,
      relatedMeetingId: relatedMeetingId ?? null,
      version: nextVersion,
      versionGroupId: resolvedVersionGroupId ?? undefined,
    },
    include: {
      uploadedBy: true,
      signatures: true,
    },
  });

  if (relatedMeetingId) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: relatedMeetingId },
    });

    if (meeting) {
      const recipientId = meeting.organizerId === userId ? meeting.inviteeId : meeting.organizerId;
      await createNotification({
        userId: recipientId,
        type: "DOCUMENT",
        title: "New document shared",
        message: `${title} has been uploaded to your collaboration chamber.`,
        metadata: {
          documentId: document.id,
          meetingId: relatedMeetingId,
        },
      });
    }
  }

  return document;
};

export const signDocument = async ({
  documentId,
  userId,
  signerName,
  signatureDataUrl,
}: {
  documentId: string;
  userId: string;
  signerName: string;
  signatureDataUrl: string;
}) => {
  const document = await ensureDocumentAccess(documentId, userId);
  const storedSignature = await persistSignatureDataUrl(signatureDataUrl);

  const signature = await prisma.signature.create({
    data: {
      documentId: document.id,
      signedById: userId,
      signerName,
      signatureUrl: storedSignature.fileUrl,
      metadata: {
        fileKey: storedSignature.fileKey,
      },
    },
  });

  const updatedDocument = await prisma.document.update({
    where: { id: document.id },
    data: {
      signatureUrl: storedSignature.fileUrl,
      status: "SIGNED",
    },
    include: {
      uploadedBy: true,
      signatures: true,
    },
  });

  if (document.uploadedById !== userId) {
    await createNotification({
      userId: document.uploadedById,
      type: "DOCUMENT",
      title: "Document signed",
      message: `${signerName} signed "${document.title}".`,
      metadata: {
        documentId: document.id,
        signatureId: signature.id,
      },
    });
  }

  return updatedDocument;
};

export const listDocumentsForUser = async (userId: string) =>
  prisma.document.findMany({
    where: {
      OR: [
        {
          uploadedById: userId,
        },
        {
          relatedMeeting: {
            OR: [{ organizerId: userId }, { inviteeId: userId }],
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
  });
