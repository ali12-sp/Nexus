import fs from "node:fs/promises";
import path from "node:path";

import { env } from "../../config/env.js";

export const getLocalPublicUrl = (fileName: string) => `/uploads/${fileName}`;

export const persistSignatureDataUrl = async (signatureDataUrl: string) => {
  const matches = signatureDataUrl.match(/^data:(image\/png|image\/jpeg|image\/webp);base64,(.+)$/);

  if (!matches) {
    throw new Error("Invalid signature image data");
  }

  const [, mimeType, base64] = matches;
  const extension = mimeType.split("/")[1];
  const fileName = `signature-${Date.now()}.${extension}`;
  const relativePath = path.join(env.UPLOAD_DIR, "signatures", fileName);
  const absolutePath = path.resolve(process.cwd(), relativePath);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, Buffer.from(base64, "base64"));

  return {
    fileKey: `signatures/${fileName}`,
    fileUrl: `/uploads/signatures/${fileName}`,
  };
};
