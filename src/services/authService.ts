import { db } from "../configs/firebase.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../libs/jwt.js";
import {
  type LoginCredentialType,
  type UserCredentialType,
} from "../types/userTypes.js";
import bcrypt from "bcrypt";

type AuthResponse = {
  id: string;
  accessToken: string;
  refreshToken: string;
};

export const login = async ({
  email,
  password,
}: LoginCredentialType): Promise<AuthResponse> => {
  if (!email || !password) throw new Error("All fields are required");

  const isEmailExist = await db
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (isEmailExist.empty) throw new Error("Email not found");

  const userDoc = isEmailExist.docs[0];
  const user = userDoc?.data() as UserCredentialType;

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) throw new Error("Email or password is incorrect");

  const refreshToken = signRefreshToken({ sub: userDoc?.id as string });

  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  const accessToken = signAccessToken({
    sub: userDoc?.id as string,
    role: user.role, // ✅ FIXED (safer than userDoc.data())
  });

  const now = new Date();

  await db.collection("refreshTokens").add({
    userId: userDoc?.id,
    hashedToken: hashedRefreshToken,
    revokedAt: null,
    expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3),
    createdAt: now,
    updatedAt: now,
  });

  return {
    id: userDoc?.id as string,
    refreshToken,
    accessToken,
  };
};

export const register = async ({
  name,
  email,
  password,
  timeZone,
  role,
  schedule,
}: UserCredentialType): Promise<AuthResponse> => {
  name = name.trim();
  email = email.trim().toLowerCase();
  timeZone = timeZone.trim();

  if (!name || !email || !password || !timeZone)
    throw new Error("All fields are required");

  if (!schedule?.start || !schedule?.end)
    throw new Error("Work schedule is required");

  const isEmailExist = await db
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (!isEmailExist.empty) throw new Error("Email already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  const userRef = await db.collection("users").add({
    name,
    email,
    password: hashedPassword,
    timeZone,
    role,
    schedule,
  });

  const userId = userRef.id;

  // tokens
  const refreshToken = signRefreshToken({ sub: userId });
  const accessToken = signAccessToken({
    sub: userId,
    role,
  });

  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

  await db.collection("refreshTokens").add({
    userId,
    hashedToken: hashedRefreshToken,
    revokedAt: null,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    id: userId,
    accessToken,
    refreshToken,
  };
};

export const profile = async (userId: string) => {
  if (!userId) throw new Error("No user id");

  const userDoc = await db.collection("users").doc(userId).get();

  if (!userDoc.exists) throw new Error("No user");

  const data = userDoc.data() as UserCredentialType;
  const { password, ...safeUser } = data;
  return {
    id: userDoc.id,
    ...safeUser,
    schedule: {
      start: safeUser.schedule.start.toDate(),
      end: safeUser.schedule.end.toDate(),
    },
  };
};

export const refresh = async (token: string) => {
  if (!token) throw new Error("Unauthorized");

  const payload = verifyRefreshToken(token);

  const userId = payload.sub;
  const user = await profile(userId);

  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) throw new Error("No user found");

  const tokenSnap = await db
    .collection("refreshTokens")
    .where("userId", "==", userId)
    .where("revokedAt", "==", null)
    .limit(1)
    .get();

  if (tokenSnap.empty) throw new Error("No active session");

  const doc = tokenSnap.docs[0];
  const data = doc?.data();

  const isValid = await bcrypt.compare(token, data?.hashedToken);
  if (!isValid) throw new Error("Invalid refresh token");

  // revoke old token
  await doc?.ref.update({
    revokedAt: new Date(),
    updatedAt: new Date(),
  });

  // generate new tokens
  const newRefreshToken = signRefreshToken({ sub: userId });
  const newAccessToken = signAccessToken({ sub: userId, role: user.role });

  const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);

  const now = new Date();

  await db.collection("refreshTokens").add({
    userId,
    hashedToken: hashedRefreshToken,
    revokedAt: null,
    expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3),
    createdAt: now,
    updatedAt: now,
  });

  return {
    newRefreshToken,
    newAccessToken,
  };
};
