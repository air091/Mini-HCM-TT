import { db } from "../config/firebase";
import { signRefreshToken } from "../lib/jwt";
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
  const snapshot = await db.collection("users").add({
    name,
    email,
    hashedPassword,
    timeZone,
    schedule,
  });

  return snapshot.id;
};
