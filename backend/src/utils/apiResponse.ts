import { Response } from "express";

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = "Request completed successfully",
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};
