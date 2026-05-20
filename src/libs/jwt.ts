import dotenv from "dotenv";
import jwt, { type SignOptions, type JwtPayload } from "jsonwebtoken";
import ms from "ms";
dotenv.config();

// token and expiration
const REFRESH_TOKEN_SECRET = process.env.REFRESH_SECRET as string;
const ACCESS_TOKEN_SECRET = process.env.ACCESS_SECRET as string;
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRE as string;
const ACCESS_EXPIRES_IN = process.env.ACCESS_EXPIRE as string;

// validate
if (!REFRESH_TOKEN_SECRET || !ACCESS_TOKEN_SECRET)
  throw new Error("Tokens not found");
if (!REFRESH_EXPIRES_IN || !ACCESS_EXPIRES_IN)
  throw new Error("Token expirations not found");

// payloads
type RefreshPayload = JwtPayload & {
  sub: string;
};

export type AccessPayload = JwtPayload & {
  sub: string;
};

// options
const refreshOptions: SignOptions = {
  expiresIn: REFRESH_EXPIRES_IN as ms.StringValue,
  algorithm: "HS256",
};

const accessOptions: SignOptions = {
  expiresIn: ACCESS_EXPIRES_IN as ms.StringValue,
  algorithm: "HS256",
};

// sign
export function signRefreshToken(payload: RefreshPayload): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, refreshOptions);
}

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, accessOptions);
}

// verify
export function verifyRefreshToken(token: string) {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as RefreshPayload;
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessPayload;
}
