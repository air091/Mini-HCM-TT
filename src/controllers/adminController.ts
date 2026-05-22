import type { Request, Response } from "express";
import {
  getAllEmployees,
  getDailyEmployeeReports,
  getEmployee,
  getWeeklyEmployeeReports,
  updateEmployeePunches,
} from "../services/adminService.js";
import { parseBusinessDateTime } from "../libs/businessTime.js";

export const getAllEmployeesController = async (
  request: Request,
  response: Response,
) => {
  try {
    const user = request.user;
    if (!user) return response.status(401).json({ message: "Unauthorized" });

    const employees = await getAllEmployees();
    return response
      .status(200)
      .json({ message: "Employees fetched successfully", employees });
  } catch (error) {
    console.log(`Get all employees controller failed ${error}`);
    return response.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const getEmployeeController = async (
  request: Request,
  response: Response,
) => {
  try {
    const user = request.user;
    if (!user) return response.status(401).json({ message: "Unauthorized" });

    const { userId } = request.params;
    if (!userId)
      return response.status(400).json({ message: "Missing params" });

    const employee = await getEmployee(userId as string);
    return response
      .status(200)
      .json({ message: "Employee fetched successful", employee });
  } catch (error) {
    console.log(`Get employee controller failed ${error}`);
    return response.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const updateEmployeePunchesController = async (
  request: Request,
  response: Response,
) => {
  try {
    const user = request.user;
    if (!user) return response.status(401).json({ message: "Unauthorized" });

    const { userId, attendanceId } = request.params;
    const { timeIn, timeOut } = request.body;

    if (!attendanceId)
      return response.status(400).json({ message: "Missing params" });

    const updatedAttendance = await updateEmployeePunches(
      userId as string,
      attendanceId as string,
      parseBusinessDateTime(timeIn),
      parseBusinessDateTime(timeOut),
    );
    return response.status(200).json({
      message: "Employee punch updated successfully",
      attendance: updatedAttendance,
    });
  } catch (error) {
    console.log(`Update employee punches controller failed ${error}`);
    return response.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const dailyReportController = async (
  request: Request,
  response: Response,
) => {
  try {
    const user = request.user;
    if (!user) return response.status(401).json({ message: "Unauthorized" });

    const { date } = request.query;
    const attendance = await getDailyEmployeeReports(date as string);
    return response.status(200).json({ daily_attendance: attendance });
  } catch (error) {
    console.log(`Daily report controller failed ${error}`);
    return response.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const weeklyReportController = async (
  request: Request,
  response: Response,
) => {
  try {
    const user = request.user;
    if (!user) return response.status(401).json({ message: "Unauthorized" });

    const { date } = request.query;
    const attendance = await getWeeklyEmployeeReports(date as string);
    return response.status(200).json({ weekly_attendance: attendance });
  } catch (error) {
    console.log(`Weekly report controller failed ${error}`);
    return response.status(500).json({
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};
