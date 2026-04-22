import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export const hashPassword = async (password: string) => bcrypt.hash(password, 12);

export const comparePassword = async (password: string, hash: string) =>
  bcrypt.compare(password, hash);

export const signAccessToken = (userId: string) =>
  jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
