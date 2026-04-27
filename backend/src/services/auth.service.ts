import { StatusCodes } from "http-status-codes";
import { User } from "../../generated/prisma-client/index.js";

import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { createAuditLog, listAuditLogsForUser } from "./audit.service.js";
import { sendMail } from "./mail.service.js";
import { createNotification } from "./notification.service.js";
import {
  comparePassword,
  createSessionTokens,
  hashPassword,
  verifyRefreshToken,
} from "../utils/auth.js";
import { createOpaqueToken, hashOpaqueToken } from "../utils/opaqueToken.js";
import { AppError } from "../utils/appError.js";
import { serializeAuditLog, serializeUser } from "../utils/serializers.js";
import type { RequestMetadata } from "../utils/requestMetadata.js";

type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
  requestMetadata?: RequestMetadata;
  role: "INVESTOR" | "ENTREPRENEUR";
};

type LoginInput = {
  email: string;
  password: string;
  requestMetadata?: RequestMetadata;
};

type OtpPurposeValue = "LOGIN" | "SENSITIVE_ACTION";

type LifecycleTokenResult = {
  expiresAt: Date;
  previewToken?: string;
  previewUrl?: string;
};

const buildSessionResponse = (user: User) => {
  const sessionTokens = createSessionTokens(user.id);

  return {
    ...sessionTokens,
    user: serializeUser(user),
  };
};

const buildPreviewPayload = (token: string, url: string) =>
  env.NODE_ENV === "production"
    ? {}
    : {
        previewToken: token,
        previewUrl: url,
      };

const issueEmailVerificationToken = async (user: User): Promise<LifecycleTokenResult> => {
  await prisma.emailVerificationToken.deleteMany({
    where: {
      userId: user.id,
      consumedAt: null,
    },
  });

  const token = createOpaqueToken();
  const expiresAt = new Date(
    Date.now() + env.EMAIL_VERIFICATION_TOKEN_EXPIRES_HOURS * 60 * 60 * 1000,
  );
  const verificationUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;

  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashOpaqueToken(token),
      expiresAt,
    },
  });

  await sendMail({
    to: user.email,
    subject: "Verify your Nexus email address",
    html: `<p>Hello ${user.fullName},</p><p>Please verify your Nexus email by using this link:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p><p>This verification link expires in ${env.EMAIL_VERIFICATION_TOKEN_EXPIRES_HOURS} hours.</p>`,
  });

  return {
    expiresAt,
    ...buildPreviewPayload(token, verificationUrl),
  };
};

const issuePasswordResetToken = async (user: User): Promise<LifecycleTokenResult> => {
  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: user.id,
      consumedAt: null,
    },
  });

  const token = createOpaqueToken();
  const expiresAt = new Date(
    Date.now() + env.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES * 60 * 1000,
  );
  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashOpaqueToken(token),
      expiresAt,
    },
  });

  await sendMail({
    to: user.email,
    subject: "Reset your Nexus password",
    html: `<p>Hello ${user.fullName},</p><p>We received a request to reset your Nexus password.</p><p>Use this secure link to continue:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in ${env.PASSWORD_RESET_TOKEN_EXPIRES_MINUTES} minutes.</p>`,
  });

  return {
    expiresAt,
    ...buildPreviewPayload(token, resetUrl),
  };
};

export const registerUser = async ({
  fullName,
  email,
  password,
  requestMetadata,
  role,
}: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    await createAuditLog({
      action: "AUTH_REGISTER",
      entityType: "User",
      ipAddress: requestMetadata?.ipAddress,
      metadata: {
        email,
        reason: "duplicate_email",
        requestId: requestMetadata?.requestId,
      },
      status: "FAILURE",
      userAgent: requestMetadata?.userAgent,
      userId: existingUser.id,
    });

    throw new AppError("An account with this email already exists", StatusCodes.CONFLICT);
  }

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      role,
      passwordHash: await hashPassword(password),
      preferredIndustries: [],
      preferences: {},
    },
  });

  const verificationLifecycle = await issueEmailVerificationToken(user);

  await createNotification({
    userId: user.id,
    type: "SYSTEM",
    title: "Welcome to Nexus",
    message: "Your account is ready. Complete your profile to unlock better collaboration matches.",
  });

  await createNotification({
    userId: user.id,
    type: "SECURITY",
    title: "Verify your email",
    message: "A verification link has been issued so you can secure your account and recovery flows.",
  });

  await createAuditLog({
    action: "AUTH_REGISTER",
    entityType: "User",
    entityId: user.id,
    ipAddress: requestMetadata?.ipAddress,
    metadata: {
      email: user.email,
      requestId: requestMetadata?.requestId,
      role: user.role,
    },
    userAgent: requestMetadata?.userAgent,
    userId: user.id,
  });

  return {
    ...buildSessionResponse(user),
    emailVerification: verificationLifecycle,
  };
};

export const loginUser = async ({ email, password, requestMetadata }: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    await createAuditLog({
      action: "AUTH_LOGIN",
      entityType: "User",
      ipAddress: requestMetadata?.ipAddress,
      metadata: {
        email,
        reason: "invalid_credentials",
        requestId: requestMetadata?.requestId,
      },
      status: "FAILURE",
      userAgent: requestMetadata?.userAgent,
    });

    throw new AppError("Invalid email or password", StatusCodes.UNAUTHORIZED);
  }

  const isValidPassword = await comparePassword(password, user.passwordHash);

  if (!isValidPassword) {
    await createAuditLog({
      action: "AUTH_LOGIN",
      entityType: "User",
      entityId: user.id,
      ipAddress: requestMetadata?.ipAddress,
      metadata: {
        email,
        reason: "invalid_credentials",
        requestId: requestMetadata?.requestId,
      },
      status: "FAILURE",
      userAgent: requestMetadata?.userAgent,
      userId: user.id,
    });

    throw new AppError("Invalid email or password", StatusCodes.UNAUTHORIZED);
  }

  await createAuditLog({
    action: "AUTH_LOGIN",
    entityType: "User",
    entityId: user.id,
    ipAddress: requestMetadata?.ipAddress,
    metadata: {
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      requestId: requestMetadata?.requestId,
    },
    userAgent: requestMetadata?.userAgent,
    userId: user.id,
  });

  return buildSessionResponse(user);
};

export const refreshUserSession = async (
  refreshToken: string,
  requestMetadata?: RequestMetadata,
) => {
  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    await createAuditLog({
      action: "AUTH_REFRESH",
      entityType: "Session",
      ipAddress: requestMetadata?.ipAddress,
      metadata: {
        reason: "token_verification_failed",
        requestId: requestMetadata?.requestId,
      },
      status: "FAILURE",
      userAgent: requestMetadata?.userAgent,
    });

    throw new AppError("Refresh session is invalid or expired", StatusCodes.UNAUTHORIZED);
  }

  if (!payload.sub || typeof payload.sub !== "string") {
    throw new AppError("Refresh session is invalid", StatusCodes.UNAUTHORIZED);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
  });

  if (!user) {
    await createAuditLog({
      action: "AUTH_REFRESH",
      entityType: "Session",
      entityId: payload.sub,
      ipAddress: requestMetadata?.ipAddress,
      metadata: {
        reason: "user_not_found",
        requestId: requestMetadata?.requestId,
      },
      status: "FAILURE",
      userAgent: requestMetadata?.userAgent,
      userId: payload.sub,
    });

    throw new AppError("User session is no longer valid", StatusCodes.UNAUTHORIZED);
  }

  await createAuditLog({
    action: "AUTH_REFRESH",
    entityType: "Session",
    entityId: user.id,
    ipAddress: requestMetadata?.ipAddress,
    metadata: {
      requestId: requestMetadata?.requestId,
    },
    userAgent: requestMetadata?.userAgent,
    userId: user.id,
  });

  return buildSessionResponse(user);
};

export const sendOtpCode = async ({
  email,
  purpose,
  requestMetadata,
}: {
  email: string;
  purpose: OtpPurposeValue;
  requestMetadata?: RequestMetadata;
}) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    await createAuditLog({
      action: "AUTH_SEND_OTP",
      entityType: "User",
      ipAddress: requestMetadata?.ipAddress,
      metadata: {
        email,
        purpose,
        reason: "user_not_found",
        requestId: requestMetadata?.requestId,
      },
      status: "FAILURE",
      userAgent: requestMetadata?.userAgent,
    });

    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.twoFactorCode.create({
    data: {
      userId: user.id,
      code,
      purpose,
      expiresAt,
    },
  });

  await sendMail({
    to: user.email,
    subject: "Your Nexus verification code",
    html: `<p>Hello ${user.fullName},</p><p>Your Nexus verification code is <strong>${code}</strong>. It expires in ${env.OTP_EXPIRY_MINUTES} minutes.</p>`,
  });

  await createNotification({
    userId: user.id,
    type: "SECURITY",
    title: "Verification code issued",
    message: `A ${purpose.toLowerCase().replace("_", " ")} verification code was generated for your account.`,
  });

  await createAuditLog({
    action: "AUTH_SEND_OTP",
    entityType: "TwoFactorCode",
    entityId: user.id,
    ipAddress: requestMetadata?.ipAddress,
    metadata: {
      purpose,
      requestId: requestMetadata?.requestId,
    },
    userAgent: requestMetadata?.userAgent,
    userId: user.id,
  });

  return {
    deliveredTo: user.email,
    expiresAt,
    fallbackCodePreview: env.NODE_ENV === "development" ? code : undefined,
  };
};

export const verifyOtpCode = async ({
  email,
  code,
  purpose,
  requestMetadata,
}: {
  email: string;
  code: string;
  purpose: OtpPurposeValue;
  requestMetadata?: RequestMetadata;
}) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    await createAuditLog({
      action: "AUTH_VERIFY_OTP",
      entityType: "TwoFactorCode",
      ipAddress: requestMetadata?.ipAddress,
      metadata: {
        email,
        purpose,
        reason: "user_not_found",
        requestId: requestMetadata?.requestId,
      },
      status: "FAILURE",
      userAgent: requestMetadata?.userAgent,
    });

    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  const otp = await prisma.twoFactorCode.findFirst({
    where: {
      userId: user.id,
      code,
      purpose,
      verifiedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otp) {
    await createAuditLog({
      action: "AUTH_VERIFY_OTP",
      entityType: "TwoFactorCode",
      entityId: user.id,
      ipAddress: requestMetadata?.ipAddress,
      metadata: {
        purpose,
        reason: "invalid_or_expired_code",
        requestId: requestMetadata?.requestId,
      },
      status: "FAILURE",
      userAgent: requestMetadata?.userAgent,
      userId: user.id,
    });

    throw new AppError("Invalid or expired OTP code", StatusCodes.UNAUTHORIZED);
  }

  await prisma.twoFactorCode.update({
    where: { id: otp.id },
    data: {
      verifiedAt: new Date(),
    },
  });

  await createAuditLog({
    action: "AUTH_VERIFY_OTP",
    entityType: "TwoFactorCode",
    entityId: otp.id,
    ipAddress: requestMetadata?.ipAddress,
    metadata: {
      purpose,
      requestId: requestMetadata?.requestId,
    },
    userAgent: requestMetadata?.userAgent,
    userId: user.id,
  });

  return {
    verified: true,
    user: serializeUser(user),
  };
};

export const requestPasswordReset = async ({
  email,
  requestMetadata,
}: {
  email: string;
  requestMetadata?: RequestMetadata;
}) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    await createAuditLog({
      action: "AUTH_REQUEST_PASSWORD_RESET",
      entityType: "PasswordResetToken",
      ipAddress: requestMetadata?.ipAddress,
      metadata: {
        email,
        reason: "user_not_found",
        requestId: requestMetadata?.requestId,
      },
      status: "FAILURE",
      userAgent: requestMetadata?.userAgent,
    });

    return {
      accepted: true,
      deliveredTo: email,
    };
  }

  const lifecycle = await issuePasswordResetToken(user);

  await createNotification({
    userId: user.id,
    type: "SECURITY",
    title: "Password reset requested",
    message: "A password reset link has been issued for your Nexus account.",
  });

  await createAuditLog({
    action: "AUTH_REQUEST_PASSWORD_RESET",
    entityType: "PasswordResetToken",
    entityId: user.id,
    ipAddress: requestMetadata?.ipAddress,
    metadata: {
      email: user.email,
      requestId: requestMetadata?.requestId,
    },
    userAgent: requestMetadata?.userAgent,
    userId: user.id,
  });

  return {
    accepted: true,
    deliveredTo: user.email,
    expiresAt: lifecycle.expiresAt,
    previewToken: lifecycle.previewToken,
    previewUrl: lifecycle.previewUrl,
  };
};

export const resetPassword = async ({
  password,
  requestMetadata,
  token,
}: {
  password: string;
  requestMetadata?: RequestMetadata;
  token: string;
}) => {
  const resetRecord = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash: hashOpaqueToken(token),
      consumedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: true,
    },
  });

  if (!resetRecord) {
    await createAuditLog({
      action: "AUTH_RESET_PASSWORD",
      entityType: "PasswordResetToken",
      ipAddress: requestMetadata?.ipAddress,
      metadata: {
        reason: "invalid_or_expired_token",
        requestId: requestMetadata?.requestId,
      },
      status: "FAILURE",
      userAgent: requestMetadata?.userAgent,
    });

    throw new AppError("Reset link is invalid or expired", StatusCodes.UNAUTHORIZED);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetRecord.userId },
      data: {
        passwordHash: await hashPassword(password),
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: {
        consumedAt: new Date(),
      },
    }),
  ]);

  await createNotification({
    userId: resetRecord.userId,
    type: "SECURITY",
    title: "Password updated",
    message: "Your Nexus password has been changed successfully.",
  });

  await createAuditLog({
    action: "AUTH_RESET_PASSWORD",
    entityType: "PasswordResetToken",
    entityId: resetRecord.id,
    ipAddress: requestMetadata?.ipAddress,
    metadata: {
      requestId: requestMetadata?.requestId,
    },
    userAgent: requestMetadata?.userAgent,
    userId: resetRecord.userId,
  });

  return {
    reset: true,
    user: serializeUser(resetRecord.user),
  };
};

export const requestEmailVerification = async ({
  requestMetadata,
  userId,
}: {
  requestMetadata?: RequestMetadata;
  userId: string;
}) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  if (user.emailVerifiedAt) {
    return {
      alreadyVerified: true,
      deliveredTo: user.email,
      verifiedAt: user.emailVerifiedAt,
    };
  }

  const lifecycle = await issueEmailVerificationToken(user);

  await createNotification({
    userId: user.id,
    type: "SECURITY",
    title: "Verification link issued",
    message: "A fresh email verification link is ready for your account.",
  });

  await createAuditLog({
    action: "AUTH_REQUEST_EMAIL_VERIFICATION",
    entityType: "EmailVerificationToken",
    entityId: user.id,
    ipAddress: requestMetadata?.ipAddress,
    metadata: {
      requestId: requestMetadata?.requestId,
    },
    userAgent: requestMetadata?.userAgent,
    userId: user.id,
  });

  return {
    deliveredTo: user.email,
    expiresAt: lifecycle.expiresAt,
    previewToken: lifecycle.previewToken,
    previewUrl: lifecycle.previewUrl,
  };
};

export const verifyEmailAddress = async ({
  requestMetadata,
  token,
}: {
  requestMetadata?: RequestMetadata;
  token: string;
}) => {
  const verificationRecord = await prisma.emailVerificationToken.findFirst({
    where: {
      tokenHash: hashOpaqueToken(token),
      consumedAt: null,
      expiresAt: {
        gt: new Date(),
      },
    },
    include: {
      user: true,
    },
  });

  if (!verificationRecord) {
    await createAuditLog({
      action: "AUTH_VERIFY_EMAIL",
      entityType: "EmailVerificationToken",
      ipAddress: requestMetadata?.ipAddress,
      metadata: {
        reason: "invalid_or_expired_token",
        requestId: requestMetadata?.requestId,
      },
      status: "FAILURE",
      userAgent: requestMetadata?.userAgent,
    });

    throw new AppError("Verification link is invalid or expired", StatusCodes.UNAUTHORIZED);
  }

  const updatedUser = await prisma.$transaction(async (transaction) => {
    const user = await transaction.user.update({
      where: { id: verificationRecord.userId },
      data: {
        emailVerifiedAt: new Date(),
      },
    });

    await transaction.emailVerificationToken.update({
      where: { id: verificationRecord.id },
      data: {
        consumedAt: new Date(),
      },
    });

    return user;
  });

  await createNotification({
    userId: verificationRecord.userId,
    type: "SECURITY",
    title: "Email verified",
    message: "Your email address is now verified for Nexus recovery and security workflows.",
  });

  await createAuditLog({
    action: "AUTH_VERIFY_EMAIL",
    entityType: "EmailVerificationToken",
    entityId: verificationRecord.id,
    ipAddress: requestMetadata?.ipAddress,
    metadata: {
      requestId: requestMetadata?.requestId,
    },
    userAgent: requestMetadata?.userAgent,
    userId: verificationRecord.userId,
  });

  return {
    verified: true,
    user: serializeUser(updatedUser),
  };
};

export const getAuditActivity = async ({
  limit,
  userId,
}: {
  limit?: number;
  userId: string;
}) => {
  const auditLogs = await listAuditLogsForUser(userId, limit ?? 15);
  return auditLogs.map((entry) => serializeAuditLog(entry));
};
