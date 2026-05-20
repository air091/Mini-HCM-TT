import { response } from "express";
import { db } from "../config/firebase";
import { setRefreshTokenCookie } from "../lib/cookies";
import { signAccessToken, signRefreshToken } from "../lib/jwt";
import {
  LoginCredentialType,
  RegisterCredentialType,
} from "../types/userTypes";
import bcrypt from "bcrypt";

export const login = async ({
  email,
  password,
}: LoginCredentialType): Promise<string> => {
  if (!email || !password) throw new Error("All fields are required");

  // check user

  // check password

  return "";
};

export const register = async ({
  name,
  email,
  password,
  timeZone,
  schedule,
}: RegisterCredentialType) => {
  name = name.trim();
  email = email.trim().toLowerCase();
  timeZone = timeZone.trim();

  if (!name || !email || !password || !timeZone)
    throw new Error("All fields are required");

  if (!schedule || !schedule.start || !schedule.end)
    throw new Error("Work schedule is required");

  const isEmailExist = await db
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (!isEmailExist.empty) throw new Error("Email already exists");

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await db.collection("users").add({
    name,
    email,
    hashedPassword,
    timeZone,
    schedule,
  });

  const refreshToken = await signRefreshToken({ sub: user.id });
  // hash refresh token
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  const accessToken = await signAccessToken({ sub: user.id });

  // store refresh token to db
  await db.collection("refreshTokens").add({
    userId: user.id,
    hashedToken: hashedRefreshToken,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3days
  });

  return {
    userId: user.id,
    accessToken,
    refreshToken,
  };
};
