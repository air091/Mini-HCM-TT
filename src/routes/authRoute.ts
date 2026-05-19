import { Router } from "express";
import { registerController } from "../controllers/authController";

const router: Router = Router();

router.post("/register", registerController);

export default router;
