import { type Request, type Response } from "express";
import { login, profile, register } from "../services/authService.js";
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from "../libs/cookies.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../libs/jwt.js";
import { db } from "../configs/firebase.js";
import bcrypt from "bcrypt";

export const loginController = async (request: Request, response: Response) => {
  try {
    const { email, password } = request.body;
    const user = await login({ email, password });

    // refresh token in cookie
    setRefreshTokenCookie(response, user.refreshToken);

    return response.status(200).json({
      message: "Log in successful",
      userId: user.id,
      accessToken: user.accessToken,
    });
  } catch (error) {
    console.log(`Login controller failed ${error}`);
    return response
      .status(500)
      .json({ message: error instanceof Error ? error.message : error });
  }
};

export const registerController = async (
  request: Request,
  response: Response,
) => {
  try {
    const { name, email, password, role, timeZone, schedule } = request.body;
    const newUser = await register({
      name,
      email,
      password,
      role,
      timeZone,
      schedule,
    });

    // set referesh token in coookie
    setRefreshTokenCookie(response, newUser.refreshToken);

    return response.status(201).json({
      message: "Register successful",
      user: newUser.id,
      accessToken: newUser.accessToken,
    });
  } catch (error) {
    console.error(`Register controller failed ${error}`);
    return response
      .status(500)
      .json({ message: error instanceof Error ? error.message : error });
  }
};

export const logoutController = async (
  request: Request,
  response: Response,
) => {
  try {
    clearRefreshTokenCookie(response);
    return response.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error(`Logout controller failed ${error}`);
    return response
      .status(500)
      .json({ message: error instanceof Error ? error.message : error });
  }
};

export const profileController = async (
  request: Request,
  response: Response,
) => {
  try {
    const { userId } = request.params;
    console.log(userId);
    if (!userId)
      return response.status(400).json({ message: "User id is required" });

    const user = await profile(userId as string);
    return response
      .status(200)
      .json({ message: "User fetched successful", user });
  } catch (error) {
    console.error(`Profile controller failed ${error}`);
    return response
      .status(500)
      .json({ message: error instanceof Error ? error.message : error });
  }
};

export const refreshController = async (
  request: Request,
  response: Response,
) => {
  try {
    const token = request.cookies.refreshToken;
    if (!token) return response.status(401).json({ message: "Unauthorized" });

    const payload = verifyRefreshToken(token);

    // check user
    const userDoc = await db.collection("users").doc(payload.sub).get();
    if (!userDoc.exists)
      return response.status(404).json({ message: "No user found" });

    // get the valid token (!revoked)
    const storedToken = await db
      .collection("refreshTokens")
      .where("userId", "==", userDoc.id)
      .where("revokedAt", "==", null)
      .limit(1)
      .get();
    if (storedToken.empty)
      return response.status(404).json({ message: "No active token found" });

    const tokenSnapshot = storedToken.docs[0];
    const tokenDoc = tokenSnapshot?.data();

    // check validation by date
    if (tokenDoc?.expiresAt.toDate() < new Date())
      return response.status(401).json({ message: "Token expired" });

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
      expiresAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3), // 1min
      createdAt: now,
      updatedAt: now,
    });
    setRefreshTokenCookie(response, newRefreshToken);

    return response
      .status(200)
      .json({ message: "Token refreshed", accessToken: newAccessToken });
  } catch (error) {
    console.error(`Refresh controller failed ${error}`);
    return response
      .status(500)
      .json({ message: error instanceof Error ? error.message : error });
  }
};
