import { User } from "../../generated/prisma-client/index.js";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      requestId?: string;
    }
  }
}

export {};
