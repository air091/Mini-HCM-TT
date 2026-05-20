import { db } from "../configs/firebase.js";
import { signAccessToken, signRefreshToken } from "../libs/jwt.js";
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

  await db.collection("refreshTokens").add({
    userId: userDoc.id,
    hashedToken: hashedRefreshToken,
    expiredAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3days
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

export const profile = async (userId: string): Promise<void> => {
  if (!userId) throw new Error("No user id");
  const userDoc = await db.collection("users").doc(userId).get();
  // if (!userDoc.exists) throw new Error("No user");
  // const user = {
  //   id: userDoc.id,
  //   ...userDoc.data(),
  // };
  console.log(userDoc.id);
  console.log(userDoc.data());
  // return user;
};
