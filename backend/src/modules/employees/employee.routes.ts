import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { privilegeMiddleware } from "../../middleware/privilege.middleware.js";
import { createEmployeeController, getEmployeeByIdController, getEmployeesController, updateEmployeeController } from "./employee.controller.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  privilegeMiddleware("employee:create"),
  createEmployeeController
);

router.get(
  "/",
  privilegeMiddleware("employee:read"),
  getEmployeesController
);

router.get(
  "/:id",
  privilegeMiddleware("employee:read"),
  getEmployeeByIdController,
);

router.put(
  "/:id",
  privilegeMiddleware("employee:update"),
  updateEmployeeController,
);

export default router;