import { Router } from "express";
import {
  loginController,
  logoutController,
  profileController,
  refreshController,
  registerController,
} from "../controllers/authController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router: Router = Router();

router.post("/login", loginController);
router.post("/register", registerController);
router.post("/logout", authenticate, logoutController);
router.get("/profile/:userId", authenticate, profileController);
router.post("/refresh", authenticate, refreshController);

export default router;
