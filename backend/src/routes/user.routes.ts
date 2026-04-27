import { Router } from "express";

import {
  getMe,
  getUserById,
  listUsers,
  updateMe,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { updateProfileSchema, userIdParamSchema } from "../validators/user.validator.js";

export const userRouter = Router();

userRouter.get("/", requireAuth, asyncHandler(listUsers));
userRouter.get("/me", requireAuth, asyncHandler(getMe));
userRouter.put("/me", requireAuth, validate(updateProfileSchema), asyncHandler(updateMe));
userRouter.get("/:id", requireAuth, validate(userIdParamSchema), asyncHandler(getUserById));
