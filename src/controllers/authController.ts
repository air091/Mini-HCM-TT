import { Request, Response } from "express";
import { login, register } from "../services/authService";
import {
  clearRefreshTokenCookie,
  setRefreshTokenCookie,
} from "../libs/cookies";

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
