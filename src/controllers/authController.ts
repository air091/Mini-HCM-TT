import { Request, Response } from "express";
import { register } from "../services/authService";

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
    return response.status(201).json({ id: newUser });
  } catch (error) {
    console.error(error);
    return response
      .status(500)
      .json({ message: error instanceof Error ? error.message : error });
  }
};
