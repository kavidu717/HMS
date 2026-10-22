import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { privilegeMiddleware } from "../../middleware/privilege.middleware.js";
import { adjustMedicineStockController, createMedicineBatchController, createMedicineController, createMedicineVariantController, getAllMedicinesController, getExpiryMonitoringController, getStockMovementHistoryController, getVariantStockController } from "./pharmacy.controller.js";

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

router.post(
  "/medicines/:id/variants",
  privilegeMiddleware("pharmacy:create"),
  createMedicineVariantController,
);

router.post(
  "/variants/:id/batches",
  privilegeMiddleware("pharmacy:create"),
  createMedicineBatchController,
);

router.get(
  "/variants/:id/stock",
  privilegeMiddleware("pharmacy:read"),
  getVariantStockController,
);


router.patch(
  "/batches/:id/stock",
  privilegeMiddleware("pharmacy:update"),
  adjustMedicineStockController,
);


router.get(
  "/batches/:id/stock-movements",
  privilegeMiddleware("pharmacy:read"),
  getStockMovementHistoryController,
);


router.get(
  "/expiry-monitoring",
  privilegeMiddleware("pharmacy:read"),
  getExpiryMonitoringController,
);

export default router;