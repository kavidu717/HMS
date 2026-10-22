import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { privilegeMiddleware } from "../../middleware/privilege.middleware.js";
import { createMedicineController, getAllMedicinesController } from "./pharmacy.controller.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/medicines",
  privilegeMiddleware("pharmacy:create"),
  createMedicineController,
);

router.get(
  "/medicines",
  privilegeMiddleware("pharmacy:read"),
  getAllMedicinesController,
);

export default router;