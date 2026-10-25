
import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { privilegeMiddleware } from "../../middleware/privilege.middleware.js";

import {
  createEmployeeLeaveRecordController,
  getAllEmployeeLeaveRecordsController,
  getEmployeeLeaveRecordByIdController,
  updateEmployeeLeaveRecordController,
} from "./employee-leave-record.controller.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  privilegeMiddleware("employee_leave_record:create"),
  createEmployeeLeaveRecordController,
);

router.get(
  "/",
  privilegeMiddleware("employee_leave_record:read"),
  getAllEmployeeLeaveRecordsController,
);

router.get(
  "/:id",
  privilegeMiddleware("employee_leave_record:read"),
  getEmployeeLeaveRecordByIdController,
);

router.put(
  "/:id",
  privilegeMiddleware("employee_leave_record:update"),
  updateEmployeeLeaveRecordController,
);

export default router;
