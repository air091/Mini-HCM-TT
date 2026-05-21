import type { Request, Response } from "express";
import { getAllEmployees, getEmployee } from "../services/adminService.js";

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
