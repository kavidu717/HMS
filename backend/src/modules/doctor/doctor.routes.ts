import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { privilegeMiddleware } from "../../middleware/privilege.middleware.js";
import {
  assignDepartmentController,
  createDoctorController,
  createDoctorScheduleController,
  deleteDoctorScheduleController,
  getDoctorAvailabilityController,
  getDoctorSchedulesController,
  getDoctorsController,
  updateDoctorScheduleController
} from "./doctor.controller.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  privilegeMiddleware("doctor:create"),
  createDoctorController
);

router.get(
  "/",
  privilegeMiddleware("doctor:read"),
  getDoctorsController
);


router.patch(
  "/:id/department",
  privilegeMiddleware("doctor:update"),
  assignDepartmentController
);

router.post(
  "/:id/schedules",
  privilegeMiddleware("doctor:update"),
  createDoctorScheduleController
);

router.get(
  "/:id/schedules",
  privilegeMiddleware("doctor:read"),
  getDoctorSchedulesController
);

router.put(
  "/:id/schedules/:scheduleId",
  privilegeMiddleware("doctor:update"),
  updateDoctorScheduleController
);
router.delete(
  "/:id/schedules/:scheduleId",
  privilegeMiddleware("doctor:update"),
  deleteDoctorScheduleController
);

router.get(
  "/:id/availability",
  privilegeMiddleware("doctor:read"),
  getDoctorAvailabilityController,
);


export default router;