import { Router } from "express";
import { authenticate, requireRole } from "../middlewares/authMiddleware.js";
import {
  dailyReportController,
  getAllEmployeesController,
  getEmployeeController,
  updateEmployeePunchesController,
  weeklyReportController,
} from "../controllers/adminController.js";

const router: Router = Router();

router.get(
  "/daily-report",
  authenticate,
  requireRole("admin"),
  dailyReportController,
);
router.get(
  "/weekly-report",
  authenticate,
  requireRole("admin"),
  weeklyReportController,
);
router.get("/", authenticate, requireRole("admin"), getAllEmployeesController);
router.get(
  "/:userId",
  authenticate,
  requireRole("admin"),
  getEmployeeController,
);

router.patch(
  "/:userId/attendance/:attendanceId/punches",
  authenticate,
  requireRole("admin"),
  updateEmployeePunchesController,
);

export default router;
