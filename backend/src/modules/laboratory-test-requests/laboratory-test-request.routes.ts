
import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { privilegeMiddleware } from "../../middleware/privilege.middleware.js";
import { createLaboratoryTestRequestController, getLaboratoryTestRequestsController } from "./laboratory-test-request.controller.js";

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

export default router;
