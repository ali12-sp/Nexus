import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";

import { sanitizeValue } from "../utils/sanitize.js";

export const validate =
  (schema: AnyZodObject) => (req: Request, _res: Response, next: NextFunction) => {
    req.body = sanitizeValue(req.body) as Request["body"];
    req.query = sanitizeValue(req.query) as Request["query"];
    req.params = sanitizeValue(req.params) as Request["params"];

    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    return next();
  };
