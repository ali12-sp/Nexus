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
import {
  cancelMeetingSchema,
  createMeetingSchema,
  meetingIdParamSchema,
  respondMeetingSchema,
} from "../validators/meeting.validator.js";

export const meetingRouter = Router();

meetingRouter.use(requireAuth);
meetingRouter.post("/", validate(createMeetingSchema), createMeetingController);
meetingRouter.get("/", listMeetingsController);
meetingRouter.get("/:id", validate(meetingIdParamSchema), getMeetingController);
meetingRouter.patch("/:id/respond", validate(respondMeetingSchema), respondMeetingController);
meetingRouter.patch("/:id/cancel", validate(cancelMeetingSchema), cancelMeetingController);
