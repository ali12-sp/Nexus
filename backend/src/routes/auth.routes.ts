import { Router } from "express";

import {
  listAuditLogsController,
  login,
  logout,
  refresh,
  register,
  requestEmailVerificationController,
  requestPasswordResetController,
  resetPasswordController,
  sendOtp,
  verifyEmailController,
  verifyOtp,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { authRateLimiter } from "../middleware/rateLimit.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  auditLogListSchema,
  loginSchema,
  requestPasswordResetSchema,
  registerSchema,
  resetPasswordSchema,
  sendOtpSchema,
  verifyEmailSchema,
  verifyOtpSchema,
} from "../validators/auth.validator.js";

export const authRouter = Router();

authRouter.post("/register", authRateLimiter, validate(registerSchema), asyncHandler(register));
authRouter.post("/login", authRateLimiter, validate(loginSchema), asyncHandler(login));
authRouter.post("/refresh", authRateLimiter, asyncHandler(refresh));
authRouter.post("/logout", asyncHandler(logout));
authRouter.post(
  "/request-password-reset",
  authRateLimiter,
  validate(requestPasswordResetSchema),
  asyncHandler(requestPasswordResetController),
);
authRouter.post(
  "/reset-password",
  authRateLimiter,
  validate(resetPasswordSchema),
  asyncHandler(resetPasswordController),
);
authRouter.post(
  "/request-email-verification",
  requireAuth,
  authRateLimiter,
  asyncHandler(requestEmailVerificationController),
);
authRouter.post(
  "/verify-email",
  authRateLimiter,
  validate(verifyEmailSchema),
  asyncHandler(verifyEmailController),
);
authRouter.post("/send-otp", authRateLimiter, validate(sendOtpSchema), asyncHandler(sendOtp));
authRouter.post(
  "/verify-otp",
  authRateLimiter,
  validate(verifyOtpSchema),
  asyncHandler(verifyOtp),
);
authRouter.get(
  "/audit-logs",
  requireAuth,
  validate(auditLogListSchema),
  asyncHandler(listAuditLogsController),
);
