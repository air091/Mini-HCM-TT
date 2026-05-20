import { Router } from "express";
import {
  loginController,
  logoutController,
  profileController,
  registerController,
} from "../controllers/authController";
import { authenticate } from "../middlewares/authMiddleware";

const router: Router = Router();

router.post("/login", loginController);
router.post("/register", registerController);
router.post("/logout", authenticate, logoutController);
router.get("/profile/:userId", authenticate, profileController);

export default router;
