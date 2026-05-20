import dotenv from "dotenv";
import type { Response } from "express";

dotenv.config();

const isProduction: boolean = process.env.config === "production";

export function setRefreshTokenCookie(response: Response, token: string) {
  return response.cookie("refreshToken", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 3, // 3days
  });
}

export function clearRefreshTokenCookie(response: Response) {
  return response.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
}
