import { Router } from "express";
import {
  punchInController,
  punchOutController,
} from "../controllers/attendanceController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router: Router = Router();

router.post("/punch-in", authenticate, punchInController);
router.patch("/punch-out", authenticate, punchOutController);

export default router;
