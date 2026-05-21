import type { Request, Response } from "express";
import {
  getAttendanceById,
  getAttendancesByUser,
  punchIn,
  punchOut,
} from "../services/attendanceService.js";
import { metrics } from "../services/calculationService.js";

export const getAttendancesController = async (
  request: Request,
  response: Response,
) => {
  try {
    const user = request.user;
    if (!user) return response.status(401).json({ message: "Unauthorized" });

    const attendances = await getAttendancesByUser(user.sub);
    return response.status(200).json({ attendances });
  } catch (error) {
    console.error(`Attendaces controller failed ${error}`);
    return response
      .status(500)
      .json({ message: error instanceof Error ? error.message : error });
  }
};

export const getAttendanceByIdController = async (
  request: Request,
  response: Response,
) => {
  try {
    const user = request.user;
    if (!user) return response.status(401).json({ message: "Unauthorized" });

    const { attendanceId } = request.params;

    const attendance = await getAttendanceById(attendanceId as string);
    return response.status(200).json({ attendance });
  } catch (error) {
    console.error(`Attendace by ID controller failed ${error}`);
    return response
      .status(500)
      .json({ message: error instanceof Error ? error.message : error });
  }
};

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

export const metricController = async (
  request: Request,
  response: Response,
) => {
  try {
    const user = request.user;
    if (!user) return response.status(401).json({ message: "Unauthorized" });

    // const hours = await metrics();

    // return response.status(200).json({ message: hours });
  } catch (error) {
    console.error(`Calculate controller failed ${error}`);
    return response
      .status(500)
      .json({ message: error instanceof Error ? error.message : error });
  }
};
