import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export const hashPassword = async (password: string) => bcrypt.hash(password, 12);

export const comparePassword = async (password: string, hash: string) =>
  bcrypt.compare(password, hash);

type SignedToken = {
  token: string;
  expiresAt: Date;
};

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
};

const signToken = (
  userId: string,
  secret: string,
  expiresIn: jwt.SignOptions["expiresIn"],
): SignedToken => {
  const token = jwt.sign({ sub: userId }, secret, { expiresIn });
  const payload = jwt.decode(token);

  if (!payload || typeof payload === "string" || !payload.exp) {
    throw new Error("Unable to determine token expiry");
  }

  return {
    token,
    expiresAt: new Date(payload.exp * 1000),
  };
};

export const createAccessToken = (userId: string) =>
  signToken(userId, env.JWT_SECRET, env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]);

export const createRefreshToken = (userId: string) =>
  signToken(
    userId,
    env.JWT_REFRESH_SECRET,
    env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  );

export const createSessionTokens = (userId: string): SessionTokens => {
  const access = createAccessToken(userId);
  const refresh = createRefreshToken(userId);

  return {
    accessToken: access.token,
    refreshToken: refresh.token,
    accessTokenExpiresAt: access.expiresAt,
    refreshTokenExpiresAt: refresh.expiresAt,
  };
};

export const signAccessToken = (userId: string) => createAccessToken(userId).token;

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
