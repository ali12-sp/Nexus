import { Router } from "express";

import { listNotificationsController } from "../controllers/notification.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

export const notificationRouter = Router();

notificationRouter.use(requireAuth);
notificationRouter.get("/", listNotificationsController);
