import { Router } from "express";
import {
  getAttendanceByIdController,
  getAttendancesController,
  metricController,
  punchInController,
  punchOutController,
} from "../controllers/attendanceController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router: Router = Router();

router.post("/punch-in", authenticate, punchInController);
router.post("/calculate", authenticate, metricController);

router.patch("/punch-out", authenticate, punchOutController);

router.get("/", authenticate, getAttendancesController);
router.get("/:attendanceId", authenticate, getAttendanceByIdController);

export default router;
