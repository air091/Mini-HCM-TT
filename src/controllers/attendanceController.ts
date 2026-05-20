import type { Request, Response } from "express";
import { punchIn, punchOut } from "../services/attendanceService.js";

export const punchInController = async (
  request: Request,
  response: Response,
) => {
  try {
    // check logged in user
    const user = request.user;
    if (!user) return response.status(401).json({ message: "Unauthorized" });
    const punch = await punchIn(user.sub);

    return response
      .status(201)
      .json({ message: "User punched in successully", punch });
  } catch (error) {
    console.error(`Punch in controller failed ${error}`);
    return response
      .status(500)
      .json({ message: error instanceof Error ? error.message : error });
  }
};

export const punchOutController = async (
  request: Request,
  response: Response,
) => {
  try {
    const user = request.user;
    if (!user) return response.status(401).json({ message: "Unauthorized" });
    const punch = await punchOut(user.sub);

    return response
      .status(201)
      .json({ message: "User punched in successully", punch });
  } catch (error) {
    console.error(`Punch out controller failed ${error}`);
    return response
      .status(500)
      .json({ message: error instanceof Error ? error.message : error });
  }
};
