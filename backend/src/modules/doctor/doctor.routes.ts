import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { privilegeMiddleware } from "../../middleware/privilege.middleware.js";
import {
  assignDepartmentController,
  createDoctorController
} from "./doctor.controller.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  privilegeMiddleware("doctor:create"),
  createDoctorController
);

router.patch(
  "/:id/department",
  privilegeMiddleware("doctor:update"),
  assignDepartmentController
);

export default router;