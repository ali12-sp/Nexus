import { Router } from "express";

import { login, register, sendOtp, verifyOtp } from "../controllers/auth.controller.js";
import { authRateLimiter } from "../middleware/rateLimit.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  loginSchema,
  registerSchema,
  sendOtpSchema,
  verifyOtpSchema,
} from "../validators/auth.validator.js";

export const authRouter = Router();

authRouter.post("/register", authRateLimiter, validate(registerSchema), register);
authRouter.post("/login", authRateLimiter, validate(loginSchema), login);
authRouter.post("/send-otp", authRateLimiter, validate(sendOtpSchema), sendOtp);
authRouter.post("/verify-otp", authRateLimiter, validate(verifyOtpSchema), verifyOtp);
