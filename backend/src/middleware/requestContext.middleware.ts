import { randomUUID } from "node:crypto";

import { NextFunction, Request, Response } from "express";

export const attachRequestContext = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const headerRequestId = req.header("x-request-id");
  const requestId =
    typeof headerRequestId === "string" && headerRequestId.trim().length > 0
      ? headerRequestId.trim()
      : randomUUID();

  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  next();
};
