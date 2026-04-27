import { Router } from "express";

import { listNotificationsController } from "../controllers/notification.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const notificationRouter = Router();

notificationRouter.use(requireAuth);
notificationRouter.get("/", asyncHandler(listNotificationsController));
