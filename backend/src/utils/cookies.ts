import { Request, Response } from "express";

import { env } from "../config/env.js";

const getCookieSecurity = () => {
  const isProduction = env.NODE_ENV === "production";
  const sameSite: "none" | "lax" = isProduction ? "none" : "lax";

  return {
    secure: isProduction || env.COOKIE_SECURE,
    sameSite,
  };
};

export const readCookie = (cookieHeader: string | undefined, name: string) => {
  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(name.length + 1));
};

export const getRefreshTokenFromRequest = (req: Request) =>
  readCookie(req.headers.cookie, env.REFRESH_TOKEN_COOKIE_NAME);

export const setRefreshTokenCookie = (
  res: Response,
  refreshToken: string,
  expiresAt: Date,
) => {
  const { secure, sameSite } = getCookieSecurity();

  res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    expires: expiresAt,
    path: "/api/auth",
    domain: env.COOKIE_DOMAIN || undefined,
  });
};

export const clearRefreshTokenCookie = (res: Response) => {
  const { secure, sameSite } = getCookieSecurity();

  res.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/api/auth",
    domain: env.COOKIE_DOMAIN || undefined,
  });
};
