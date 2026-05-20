import { Router } from "express";
import { punchInController } from "../controllers/attendanceController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router: Router = Router();

router.post("/punch-in", authenticate, punchInController);

export default router;
