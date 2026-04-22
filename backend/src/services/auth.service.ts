import { StatusCodes } from "http-status-codes";

import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { sendMail } from "./mail.service.js";
import { createNotification } from "./notification.service.js";
import { comparePassword, hashPassword, signAccessToken } from "../utils/auth.js";
import { AppError } from "../utils/appError.js";
import { serializeUser } from "../utils/serializers.js";

type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
  role: "INVESTOR" | "ENTREPRENEUR";
};

type LoginInput = {
  email: string;
  password: string;
};

export const registerUser = async ({ fullName, email, password, role }: RegisterInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
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

  await createNotification({
    userId: user.id,
    type: "SYSTEM",
    title: "Welcome to Nexus",
    message: "Your account is ready. Complete your profile to unlock better collaboration matches.",
  });

  return {
    token: signAccessToken(user.id),
    user: serializeUser(user),
  };
};

export const loginUser = async ({ email, password }: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError("Invalid email or password", StatusCodes.UNAUTHORIZED);
  }

  const isValidPassword = await comparePassword(password, user.passwordHash);

  if (!isValidPassword) {
    throw new AppError("Invalid email or password", StatusCodes.UNAUTHORIZED);
  }

  return {
    token: signAccessToken(user.id),
    user: serializeUser(user),
  };
};

export const sendOtpCode = async ({
  email,
  purpose,
}: {
  email: string;
  purpose: "LOGIN" | "SENSITIVE_ACTION";
}) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
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
}: {
  email: string;
  code: string;
  purpose: "LOGIN" | "SENSITIVE_ACTION";
}) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
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
    throw new AppError("Invalid or expired OTP code", StatusCodes.UNAUTHORIZED);
  }

  await prisma.twoFactorCode.update({
    where: { id: otp.id },
    data: {
      verifiedAt: new Date(),
    },
  });

  return {
    verified: true,
    user: serializeUser(user),
  };
};
