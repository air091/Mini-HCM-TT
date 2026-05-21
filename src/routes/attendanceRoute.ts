import { Router } from "express";
import {
  calculateController,
  punchInController,
  punchOutController,
} from "../controllers/attendanceController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router: Router = Router();

router.post("/punch-in", authenticate, punchInController);
router.patch("/punch-out", authenticate, punchOutController);
router.post("/calculate", authenticate, calculateController);

export default router;
