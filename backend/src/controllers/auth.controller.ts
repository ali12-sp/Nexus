import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import {
  getAuditActivity,
  loginUser,
  requestEmailVerification,
  requestPasswordReset,
  registerUser,
  resetPassword,
  refreshUserSession,
  sendOtpCode,
  verifyEmailAddress,
  verifyOtpCode,
} from "../services/auth.service.js";
import {
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
  setRefreshTokenCookie,
} from "../utils/cookies.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../utils/appError.js";
import { getRequestMetadata } from "../utils/requestMetadata.js";

type AuthSessionResult = Awaited<ReturnType<typeof loginUser>>;

const sendSessionResponse = (
  res: Response,
  result: AuthSessionResult,
  message: string,
  statusCode = StatusCodes.OK,
) => {
  setRefreshTokenCookie(res, result.refreshToken, result.refreshTokenExpiresAt);

  return sendSuccess(
    res,
    {
      token: result.accessToken,
      user: result.user,
      session: {
        accessTokenExpiresAt: result.accessTokenExpiresAt.toISOString(),
        refreshTokenExpiresAt: result.refreshTokenExpiresAt.toISOString(),
      },
    },
    message,
    statusCode,
  );
};

export const register = async (req: Request, res: Response) => {
  const result = await registerUser({
    ...req.body,
    requestMetadata: getRequestMetadata(req),
  });
  return sendSessionResponse(res, result, "Account created successfully", StatusCodes.CREATED);
};

export const login = async (req: Request, res: Response) => {
  const result = await loginUser({
    ...req.body,
    requestMetadata: getRequestMetadata(req),
  });
  return sendSessionResponse(res, result, "Login successful");
};

export const refresh = async (req: Request, res: Response) => {
  const refreshToken = getRefreshTokenFromRequest(req);

  if (!refreshToken) {
    throw new AppError("Refresh token missing", StatusCodes.UNAUTHORIZED);
  }

  const result = await refreshUserSession(refreshToken, getRequestMetadata(req));
  return sendSessionResponse(res, result, "Session refreshed successfully");
};

export const logout = async (_req: Request, res: Response) => {
  clearRefreshTokenCookie(res);
  return sendSuccess(res, { loggedOut: true }, "Session closed successfully");
};

export const sendOtp = async (req: Request, res: Response) => {
  const result = await sendOtpCode({
    ...req.body,
    requestMetadata: getRequestMetadata(req),
  });
  return sendSuccess(res, result, "OTP sent successfully");
};

export const verifyOtp = async (req: Request, res: Response) => {
  const result = await verifyOtpCode({
    ...req.body,
    requestMetadata: getRequestMetadata(req),
  });
  return sendSuccess(res, result, "OTP verified successfully");
};

export const requestPasswordResetController = async (req: Request, res: Response) => {
  const result = await requestPasswordReset({
    ...req.body,
    requestMetadata: getRequestMetadata(req),
  });

  return sendSuccess(
    res,
    result,
    "If the account exists, a password reset workflow has been started.",
  );
};

export const resetPasswordController = async (req: Request, res: Response) => {
  const result = await resetPassword({
    ...req.body,
    requestMetadata: getRequestMetadata(req),
  });

  return sendSuccess(res, result, "Password reset completed successfully");
};

export const requestEmailVerificationController = async (req: Request, res: Response) => {
  const result = await requestEmailVerification({
    userId: req.user!.id,
    requestMetadata: getRequestMetadata(req),
  });

  return sendSuccess(res, result, "Email verification workflow prepared successfully");
};

export const verifyEmailController = async (req: Request, res: Response) => {
  const result = await verifyEmailAddress({
    token: req.body.token,
    requestMetadata: getRequestMetadata(req),
  });

  return sendSuccess(res, result, "Email verified successfully");
};

export const listAuditLogsController = async (req: Request, res: Response) => {
  const limit =
    typeof req.query.limit === "string"
      ? Number(req.query.limit)
      : Array.isArray(req.query.limit)
        ? Number(req.query.limit[0])
        : undefined;

  const result = await getAuditActivity({
    userId: req.user!.id,
    limit,
  });

  return sendSuccess(res, result, "Audit activity fetched successfully");
};
