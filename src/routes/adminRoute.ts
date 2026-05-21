import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import {
  getAllEmployeesController,
  getEmployeeController,
} from "../controllers/adminController.js";

const router: Router = Router();

router.get("/", authenticate, getAllEmployeesController);
router.get("/:userId", authenticate, getEmployeeController);

export default router;
