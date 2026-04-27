import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export const notFoundHandler = (req: Request, res: Response) => {
  return res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    meta: {
      requestId: req.requestId,
    },
  });
};
