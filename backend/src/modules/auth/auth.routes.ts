import { Router } from "express";
import { activateAccount, changePassword, getMe, login } from "./auth.controller.js";

import { authMiddleware } from "../../middleware/auth.middleware.js";

const router = Router();

router.post("/login", login);

router.post(
  "/activate-account",
  activateAccount
);


router.get(
  "/me",
  authMiddleware,
  
  getMe
);

router.post(
  "/change-password",
  authMiddleware,
  changePassword
);

export default router;