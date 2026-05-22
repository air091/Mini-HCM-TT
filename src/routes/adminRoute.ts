import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import {
  dailyReportController,
  getAllEmployeesController,
  getEmployeeController,
  updateEmployeePunchesController,
  weeklyReportController,
} from "../controllers/adminController.js";

const router: Router = Router();

router.get("/daily-report", authenticate, dailyReportController);
router.get("/weekly-report", authenticate, weeklyReportController);
router.get("/", authenticate, getAllEmployeesController);
router.get("/:userId", authenticate, getEmployeeController);

router.patch(
  "/:userId/attendance/:attendanceId/punches",
  authenticate,
  updateEmployeePunchesController,
);

export default router;
