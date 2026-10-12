
import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { privilegeMiddleware } from "../../middleware/privilege.middleware.js";
import { createLaboratoryTestRequestController } from "./laboratory-test-request.controller.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  privilegeMiddleware("laboratory:create"),
  createLaboratoryTestRequestController,
);

export default router;
