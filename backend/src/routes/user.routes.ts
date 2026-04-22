import { Router } from "express";

import {
  getMe,
  getUserById,
  listUsers,
  updateMe,
} from "../controllers/user.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { updateProfileSchema, userIdParamSchema } from "../validators/user.validator.js";

export const userRouter = Router();

userRouter.get("/", requireAuth, listUsers);
userRouter.get("/me", requireAuth, getMe);
userRouter.put("/me", requireAuth, validate(updateProfileSchema), updateMe);
userRouter.get("/:id", requireAuth, validate(userIdParamSchema), getUserById);
