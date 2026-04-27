import { PrismaClient } from "../../generated/prisma-client/index.js";

declare global {
  var __nexusPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__nexusPrisma ??
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__nexusPrisma = prisma;
}
