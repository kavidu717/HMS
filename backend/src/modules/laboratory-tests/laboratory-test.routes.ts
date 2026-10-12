import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { privilegeMiddleware } from "../../middleware/privilege.middleware.js";
import {
  createLaboratoryTestController,
  getLaboratoryTestsController,
} from "./laboratory-test.controller.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  privilegeMiddleware("laboratory:create"),
  createLaboratoryTestController,
);


router.get(
  "/",
  privilegeMiddleware("laboratory:read"),
  getLaboratoryTestsController,
);

export default router;