
import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { privilegeMiddleware } from "../../middleware/privilege.middleware.js";
import { collectLaboratoryTestSampleController, createLaboratoryTestRequestController, enterLaboratoryTestResultController, generateLaboratoryReportController, getLaboratoryTestRequestByIdController, getLaboratoryTestRequestsController } from "./laboratory-test-request.controller.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  privilegeMiddleware("laboratory:create"),
  createLaboratoryTestRequestController,
);

router.get(
  "/",
  privilegeMiddleware("laboratory:read"),
  getLaboratoryTestRequestsController,
);

router.get(
  "/:id",
  privilegeMiddleware("laboratory:read"),
  getLaboratoryTestRequestByIdController,
);

router.patch(
  "/:id/collect-sample",
  privilegeMiddleware("laboratory:update"),
  collectLaboratoryTestSampleController,
);

router.patch(
  "/:id/result",
  privilegeMiddleware("laboratory:update"),
  enterLaboratoryTestResultController,
);

router.get(
  "/:id/report",
  privilegeMiddleware("laboratory:read"),
  generateLaboratoryReportController,
);

export default router;
