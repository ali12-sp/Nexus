import { Router } from "express";

import {
  getDocumentController,
  listDocumentsController,
  signDocumentController,
  updateDocumentController,
  uploadDocumentController,
} from "../controllers/document.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  documentIdParamSchema,
  signDocumentSchema,
  updateDocumentSchema,
} from "../validators/document.validator.js";

export const documentRouter = Router();

documentRouter.use(requireAuth);
documentRouter.post("/upload", upload.single("file"), asyncHandler(uploadDocumentController));
documentRouter.get("/", asyncHandler(listDocumentsController));
documentRouter.get("/:id", validate(documentIdParamSchema), asyncHandler(getDocumentController));
documentRouter.patch("/:id", validate(updateDocumentSchema), asyncHandler(updateDocumentController));
documentRouter.post("/:id/sign", validate(signDocumentSchema), asyncHandler(signDocumentController));
