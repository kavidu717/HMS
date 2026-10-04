import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { privilegeMiddleware } from "../../middleware/privilege.middleware.js";
import {
  createDepartmentController,
  getDepartmentsController
} from "./department.controller.js";

const router = Router();

router.use(authMiddleware);
 

router.get(
  "/",
  privilegeMiddleware("department:read"),
  getDepartmentsController
);

router.post(
  "/",
  privilegeMiddleware("department:create"),
  createDepartmentController
);

export default router;