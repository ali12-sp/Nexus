import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../utils/auth.js";
import { AppError } from "../utils/appError.js";

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return next(new AppError("Authorization token is required", StatusCodes.UNAUTHORIZED));
  }

  try {
    const token = authorization.replace("Bearer ", "");
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      return next(new AppError("User session is no longer valid", StatusCodes.UNAUTHORIZED));
    }

    req.user = user;
    return next();
  } catch {
    return next(new AppError("Invalid or expired token", StatusCodes.UNAUTHORIZED));
  }
};

export const requireRole =
  (...roles: Array<"INVESTOR" | "ENTREPRENEUR">) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Authentication required", StatusCodes.UNAUTHORIZED));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have access to this resource", StatusCodes.FORBIDDEN));
    }

    return next();
  };
