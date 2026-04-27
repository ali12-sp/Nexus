import { Request } from "express";

export type RequestMetadata = {
  ipAddress: string | null;
  requestId: string | null;
  userAgent: string | null;
};

const normalizeIpAddress = (value: string | undefined) => {
  if (!value) {
    return null;
  }

  return value.startsWith("::ffff:") ? value.slice(7) : value;
};

export const getRequestMetadata = (req: Request): RequestMetadata => ({
  ipAddress: normalizeIpAddress(req.ip || req.socket.remoteAddress || undefined),
  requestId: req.requestId ?? null,
  userAgent: req.get("user-agent") ?? null,
});
