import fs from "node:fs";
import path from "node:path";

import multer from "multer";
import { StatusCodes } from "http-status-codes";
import { v4 as uuid } from "uuid";

import { env } from "../config/env.js";
import { AppError } from "../utils/appError.js";

const uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);

if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadRoot);
  },
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname);
    callback(null, `${uuid()}${extension}`);
  },
});

const allowedMimeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(
        new AppError(
          "Unsupported file type. Please upload PDF, Word, PNG, JPG, or WEBP files.",
          StatusCodes.UNPROCESSABLE_ENTITY,
        ),
      );
      return;
    }

    callback(null, true);
  },
});
