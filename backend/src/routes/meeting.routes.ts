import { Router } from "express";

import {
  cancelMeetingController,
  createMeetingController,
  getMeetingController,
  listMeetingsController,
  respondMeetingController,
} from "../controllers/meeting.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  cancelMeetingSchema,
  createMeetingSchema,
  meetingIdParamSchema,
  respondMeetingSchema,
} from "../validators/meeting.validator.js";

export const meetingRouter = Router();

meetingRouter.use(requireAuth);
meetingRouter.post("/", validate(createMeetingSchema), asyncHandler(createMeetingController));
meetingRouter.get("/", asyncHandler(listMeetingsController));
meetingRouter.get("/:id", validate(meetingIdParamSchema), asyncHandler(getMeetingController));
meetingRouter.patch(
  "/:id/respond",
  validate(respondMeetingSchema),
  asyncHandler(respondMeetingController),
);
meetingRouter.patch(
  "/:id/cancel",
  validate(cancelMeetingSchema),
  asyncHandler(cancelMeetingController),
);
