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
router.get("/profile", authenticate, profileController);
router.post("/refresh", refreshController);

export default router;
