import { Router } from "express";

import {
  depositController,
  listTransactionsController,
  transferController,
  withdrawController,
} from "../controllers/payment.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { depositSchema, transferSchema, withdrawSchema } from "../validators/payment.validator.js";

export const paymentRouter = Router();

paymentRouter.use(requireAuth);
paymentRouter.post("/deposit", validate(depositSchema), depositController);
paymentRouter.post("/withdraw", validate(withdrawSchema), withdrawController);
paymentRouter.post("/transfer", validate(transferSchema), transferController);
paymentRouter.get("/transactions", listTransactionsController);
