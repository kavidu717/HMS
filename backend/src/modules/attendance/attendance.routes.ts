
import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { privilegeMiddleware } from "../../middleware/privilege.middleware.js";
import {
  createAttendanceController,
  getAttendancesController,
  getAttendanceByIdController,
  updateAttendanceController,
  getAttendancesByEmployeeController,
} from "./attendance.controller.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  privilegeMiddleware("attendance:create"),
  createAttendanceController,
);

router.get(
  "/",
  privilegeMiddleware("attendance:read"),
  getAttendancesController,
);

router.get(
  "/employee/:employeeId",
  privilegeMiddleware("attendance:read"),
  getAttendancesByEmployeeController,
);

router.get(
  "/:id",
  privilegeMiddleware("attendance:read"),
  getAttendanceByIdController,
);

router.put(
  "/:id",
  privilegeMiddleware("attendance:update"),
  updateAttendanceController,
);

export default router;
