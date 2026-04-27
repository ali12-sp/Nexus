import { Router } from "express";

import {
  depositController,
  listTransactionsController,
  transferController,
  withdrawController,
} from "../controllers/payment.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { depositSchema, transferSchema, withdrawSchema } from "../validators/payment.validator.js";

export const paymentRouter = Router();

paymentRouter.use(requireAuth);
paymentRouter.post("/deposit", validate(depositSchema), asyncHandler(depositController));
paymentRouter.post("/withdraw", validate(withdrawSchema), asyncHandler(withdrawController));
paymentRouter.post("/transfer", validate(transferSchema), asyncHandler(transferController));
paymentRouter.get("/transactions", asyncHandler(listTransactionsController));
