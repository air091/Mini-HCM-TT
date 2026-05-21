import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import {
  dailyReportController,
  getAllEmployeesController,
  getEmployeeController,
  updateEmployeePunchesController,
} from "../controllers/adminController.js";

const router: Router = Router();

router.get("/daily-report", authenticate, dailyReportController);
router.get("/", authenticate, getAllEmployeesController);
router.get("/:userId", authenticate, getEmployeeController);

router.patch(
  "/attendance/:attendanceId/punches",
  authenticate,
  updateEmployeePunchesController,
);

export default router;
