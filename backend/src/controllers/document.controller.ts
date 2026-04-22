import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { prisma } from "../lib/prisma.js";
import {
  createDocument,
  ensureDocumentAccess,
  listDocumentsForUser,
  signDocument,
} from "../services/document.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../utils/appError.js";
import { serializeDocument } from "../utils/serializers.js";

const getParamValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const uploadDocumentController = async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError("A document file is required", StatusCodes.BAD_REQUEST);
  }

  const document = await createDocument({
    file: req.file,
    userId: req.user!.id,
    title: (req.body.title as string | undefined) ?? req.file.originalname,
    relatedMeetingId: (req.body.relatedMeetingId as string | undefined) || null,
    versionGroupId: (req.body.versionGroupId as string | undefined) || null,
  });

  return sendSuccess(
    res,
    serializeDocument(document),
    "Document uploaded successfully",
    StatusCodes.CREATED,
  );
};

export const listDocumentsController = async (req: Request, res: Response) => {
  const documents = await listDocumentsForUser(req.user!.id);
  return sendSuccess(
    res,
    documents.map(serializeDocument),
    "Documents fetched successfully",
  );
};

export const getDocumentController = async (req: Request, res: Response) => {
  const documentId = getParamValue(req.params.id);

  if (!documentId) {
    throw new AppError("Document id is required", StatusCodes.BAD_REQUEST);
  }

  const document = await ensureDocumentAccess(documentId, req.user!.id);
  return sendSuccess(res, serializeDocument(document), "Document fetched successfully");
};

export const updateDocumentController = async (req: Request, res: Response) => {
  const documentId = getParamValue(req.params.id);

  if (!documentId) {
    throw new AppError("Document id is required", StatusCodes.BAD_REQUEST);
  }

  await ensureDocumentAccess(documentId, req.user!.id);

  const updatedDocument = await prisma.document.update({
    where: { id: documentId },
    data: {
      title: req.body.title,
      status: req.body.status,
      relatedMeetingId: req.body.relatedMeetingId,
    },
    include: {
      uploadedBy: true,
      signatures: true,
    },
  });

  return sendSuccess(res, serializeDocument(updatedDocument), "Document updated successfully");
};

export const signDocumentController = async (req: Request, res: Response) => {
  const documentId = getParamValue(req.params.id);

  if (!documentId) {
    throw new AppError("Document id is required", StatusCodes.BAD_REQUEST);
  }

  const document = await signDocument({
    documentId,
    userId: req.user!.id,
    signerName: req.body.signerName,
    signatureDataUrl: req.body.signatureDataUrl,
  });

  return sendSuccess(res, serializeDocument(document), "Document signed successfully");
};
