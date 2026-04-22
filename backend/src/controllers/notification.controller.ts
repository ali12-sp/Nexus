import { Request, Response } from "express";

import { listNotificationsForUser } from "../services/notification.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { serializeNotification } from "../utils/serializers.js";

export const listNotificationsController = async (req: Request, res: Response) => {
  const notifications = await listNotificationsForUser(req.user!.id);

  return sendSuccess(
    res,
    notifications.map(serializeNotification),
    "Notifications fetched successfully",
  );
};
