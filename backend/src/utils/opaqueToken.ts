import { createHash, randomBytes } from "node:crypto";

export const createOpaqueToken = () => randomBytes(32).toString("hex");

export const hashOpaqueToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");
