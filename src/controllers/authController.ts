import { Request, Response } from "express";
import { register } from "../services/authService";
import { setRefreshTokenCookie } from "../lib/cookies";

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

    return response
      .status(201)
      .json({
        message: "Register successful",
        user: newUser.userId,
        accessToken: newUser.accessToken,
      });
  } catch (error) {
    console.error(error);
    return response
      .status(500)
      .json({ message: error instanceof Error ? error.message : error });
  }
};
