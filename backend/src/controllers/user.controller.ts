import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { prisma } from "../lib/prisma.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../utils/appError.js";
import { serializeUser } from "../utils/serializers.js";

const getStringValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

const buildProfileUpdateData = (
  role: "INVESTOR" | "ENTREPRENEUR",
  body: Record<string, unknown>,
): Record<string, unknown> => {
  const commonData: Record<string, unknown> = {
    fullName: body.fullName as string | undefined,
    bio: body.bio as string | null | undefined,
    profileImage: body.profileImage as string | null | undefined,
    location: body.location as string | null | undefined,
    website: body.website as string | null | undefined,
    preferences: body.preferences as Record<string, unknown> | null | undefined,
    twoFactorEnabled: body.twoFactorEnabled as boolean | undefined,
  };

  if (role === "ENTREPRENEUR") {
    return {
      ...commonData,
      startupName: body.startupName as string | null | undefined,
      startupStage: body.startupStage as string | null | undefined,
      industry: body.industry as string | null | undefined,
      pitchSummary: body.pitchSummary as string | null | undefined,
      fundingNeeded:
        body.fundingNeeded !== undefined && body.fundingNeeded !== null
          ? Number(body.fundingNeeded)
          : body.fundingNeeded === null
            ? null
            : undefined,
      previousFunding: body.previousFunding as string | null | undefined,
    };
  }

  return {
    ...commonData,
    firmName: body.firmName as string | null | undefined,
    investmentFocus: body.investmentFocus as string | null | undefined,
    ticketSizeMin:
      body.ticketSizeMin !== undefined && body.ticketSizeMin !== null
        ? Number(body.ticketSizeMin)
        : body.ticketSizeMin === null
          ? null
          : undefined,
    ticketSizeMax:
      body.ticketSizeMax !== undefined && body.ticketSizeMax !== null
        ? Number(body.ticketSizeMax)
        : body.ticketSizeMax === null
          ? null
          : undefined,
    portfolioHistory: body.portfolioHistory as string | null | undefined,
    preferredIndustries: (body.preferredIndustries as string[] | undefined) ?? undefined,
  };
};

export const getMe = async (req: Request, res: Response) => {
  return sendSuccess(res, serializeUser(req.user!), "Profile fetched successfully");
};

export const updateMe = async (req: Request, res: Response) => {
  const updatedUser = await prisma.user.update({
    where: { id: req.user!.id },
    data: buildProfileUpdateData(req.user!.role, req.body),
  });

  return sendSuccess(res, serializeUser(updatedUser), "Profile updated successfully");
};

export const getUserById = async (req: Request, res: Response) => {
  const userId = getStringValue(req.params.id);

  if (!userId) {
    throw new AppError("User id is required", StatusCodes.BAD_REQUEST);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError("User not found", StatusCodes.NOT_FOUND);
  }

  return sendSuccess(res, serializeUser(user), "User fetched successfully");
};

export const listUsers = async (req: Request, res: Response) => {
  const role = getStringValue(req.query.role as string | string[] | undefined) as
    | "INVESTOR"
    | "ENTREPRENEUR"
    | undefined;
  const search = getStringValue(req.query.search as string | string[] | undefined)?.trim();

  const users = await prisma.user.findMany({
    where: {
      role,
      OR: search
        ? [
            { fullName: { contains: search, mode: "insensitive" } },
            { startupName: { contains: search, mode: "insensitive" } },
            { firmName: { contains: search, mode: "insensitive" } },
            { industry: { contains: search, mode: "insensitive" } },
          ]
        : undefined,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return sendSuccess(
    res,
    users.map((user: unknown) => serializeUser(user)),
    "Users fetched successfully",
  );
};
