import path from "node:path";

import { env } from "../../config/env.js";

export const resolveStoredFile = async (file: Express.Multer.File) => {
  const s3FileKey = path.basename(file.path);

  const hasS3Config = Boolean(
    env.AWS_S3_BUCKET &&
      env.AWS_REGION &&
      env.AWS_ACCESS_KEY_ID &&
      env.AWS_SECRET_ACCESS_KEY,
  );

  if (hasS3Config) {
    const { uploadFileToS3 } = await import("./s3Storage.service.js");
    const s3Url = await uploadFileToS3(file.path, s3FileKey, file.mimetype);

    if (s3Url) {
      return {
        fileKey: s3FileKey,
        fileUrl: s3Url,
      };
    }
  }

  return {
    fileKey: s3FileKey,
    fileUrl: `/uploads/${s3FileKey}`,
  };
};
