import fs from "node:fs";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { env } from "../../config/env.js";

const hasS3Config = Boolean(
  env.AWS_S3_BUCKET &&
    env.AWS_REGION &&
    env.AWS_ACCESS_KEY_ID &&
    env.AWS_SECRET_ACCESS_KEY,
);

const s3Client = hasS3Config
  ? new S3Client({
      region: env.AWS_REGION,
      endpoint: env.AWS_S3_ENDPOINT || undefined,
      forcePathStyle: Boolean(env.AWS_S3_ENDPOINT),
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY!,
      },
    } as any)
  : null;

export const uploadFileToS3 = async (filePath: string, fileKey: string, contentType: string) => {
  if (!s3Client || !env.AWS_S3_BUCKET) {
    return null;
  }

  await s3Client.send(
    new PutObjectCommand({
      Bucket: env.AWS_S3_BUCKET,
      Key: fileKey,
      Body: fs.createReadStream(filePath),
      ContentType: contentType,
    }),
  );

  const endpointBase =
    env.AWS_S3_ENDPOINT ??
    `https://${env.AWS_S3_BUCKET}.s3.${env.AWS_REGION}.amazonaws.com`;

  const normalizedBase = endpointBase.replace(/\/$/, "");

  return `${normalizedBase}/${fileKey}`;
};
