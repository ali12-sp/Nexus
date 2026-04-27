import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";

import { AppError } from "../utils/appError.js";
import { logError } from "../utils/logger.js";

const isPrismaKnownRequestError = (
  error: Error,
): error is Error & { code: string; meta?: unknown } =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  typeof (error as { code?: unknown }).code === "string";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.details ?? null,
      meta: {
        requestId: req.requestId,
      },
    });
  }

  if (error instanceof ZodError) {
    return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      success: false,
      message: "Validation failed",
      errors: error.flatten(),
      meta: {
        requestId: req.requestId,
      },
    });
  }

  if (isPrismaKnownRequestError(error)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Database request failed",
      errors: error.meta ?? error.message,
      meta: {
        requestId: req.requestId,
      },
    });
  }

  logError("Unhandled request error", {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    errorName: error.name,
    errorMessage: error.message,
  });

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: "Something went wrong",
    errors:
      process.env.NODE_ENV === "development"
        ? {
            name: error.name,
            message: error.message,
          }
        : null,
    meta: {
      requestId: req.requestId,
    },
  });
};
