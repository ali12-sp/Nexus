import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import {
  loginUser,
  registerUser,
  sendOtpCode,
  verifyOtpCode,
} from "../services/auth.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const register = async (req: Request, res: Response) => {
  const result = await registerUser(req.body);
  return sendSuccess(res, result, "Account created successfully", StatusCodes.CREATED);
};

export const login = async (req: Request, res: Response) => {
  const result = await loginUser(req.body);
  return sendSuccess(res, result, "Login successful");
};

export const sendOtp = async (req: Request, res: Response) => {
  const result = await sendOtpCode(req.body);
  return sendSuccess(res, result, "OTP sent successfully");
};

export const verifyOtp = async (req: Request, res: Response) => {
  const result = await verifyOtpCode(req.body);
  return sendSuccess(res, result, "OTP verified successfully");
};
