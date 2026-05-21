import { Router } from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { getAllEmployeesController } from "../controllers/adminController.js";

const router: Router = Router();

router.get("/", authenticate, getAllEmployeesController);

export default router;
