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

  // check user
  const isEmailExist = await db
    .collection("users")
    .where("email", "==", email)
    .limit(1)
    .get();

  if (isEmailExist.empty) throw new Error("Email not found");
  const userDoc = isEmailExist.docs[0];
  if (!userDoc?.exists) throw new Error("User document not found");
  const user = userDoc.data() as UserCredentialType;

  // check password
  const isPasswordMatch = await bcrypt.compare(password, user.password);
  if (!isPasswordMatch) throw new Error("Email or password is incorrect");

  // create token
  const refreshToken = signRefreshToken({ sub: userDoc.id });
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  const accessToken = signAccessToken({ sub: userDoc.id });

  const now = new Date();

  await db.collection("refreshTokens").add({
    userId: userDoc.id,
    hashedToken: hashedRefreshToken,
    revokedAt: null,
    expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3), // 3days
    createdAt: now,
    updatedAt: now,
  });

  return {
    id: userDoc.id,
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

  if (!schedule || !schedule.start || !schedule.end)
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
  const refreshToken = signRefreshToken({ sub: userId });
  // hash refresh token
  const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
  const accessToken = signAccessToken({ sub: userId });

  // store refresh token to db
  await db.collection("refreshTokens").add({
    userId: userId,
    hashedToken: hashedRefreshToken,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3days
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
  };
};

export const refresh = async (token: string) => {
  if (!token) throw new Error("Unauthorized");
  const payload = verifyRefreshToken(token);

  // check user
  const userDoc = await db.collection("users").doc(payload.sub).get();

  if (!userDoc.exists) throw new Error("No user found");

  // get the valid token (!revoked)
  const storedToken = await db
    .collection("refreshTokens")
    .where("userId", "==", userDoc.id)
    .where("revokedAt", "==", null)
    .limit(1)
    .get();

  const tokenSnapshot = storedToken.docs[0];
  const tokenDoc = tokenSnapshot?.data();

  // check validation by date
  if (tokenDoc?.expiresAt.toDate() < new Date())
    throw new Error("Token expired");

  // rotate token
  // revoke token
  await tokenSnapshot?.ref.update({
    revokedAt: new Date(),
    updatedAt: new Date(),
  });

  // create new token
  const newRefreshToken = signRefreshToken({ sub: userDoc.id });
  const hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
  const newAccessToken = signAccessToken({ sub: userDoc.id });

  // store hashed refresh token in db
  const now = new Date();
  await db.collection("refreshTokens").add({
    userId: userDoc.id,
    hashedToken: hashedRefreshToken,
    revokedAt: null,
    expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3), // 3d
    createdAt: now,
    updatedAt: now,
  });

  return {
    newRefreshToken,
    newAccessToken,
  };
};
