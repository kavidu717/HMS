import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { privilegeMiddleware } from "../../middleware/privilege.middleware.js";
import { createMedicineController } from "./pharmacy.controller.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/medicines",
  privilegeMiddleware("pharmacy:create"),
  createMedicineController,
);

export default router;