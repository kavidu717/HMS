import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";

import {
    cancelAppointmentController,
  createAppointment,
  getAllAppointments,
  getAppointmentByIdController,
  rescheduleAppointmentController,
  updateAppointmentStatusController
} from "./appointment.controller.js";
import { privilegeMiddleware } from "../../middleware/privilege.middleware.js";

const router = Router();

// Authenticate all appointment routes
router.use(authMiddleware);

// Create appointment
router.post(
  "/",
  privilegeMiddleware("appointment:create"),
  createAppointment
);

router.get(
  "/",
  privilegeMiddleware("appointment:read"),
  getAllAppointments
);

router.get(
  "/:id",
  privilegeMiddleware("appointment:read"),
  getAppointmentByIdController,
);

router.patch(
  "/:id/reschedule",
  privilegeMiddleware("appointment:update"),
  rescheduleAppointmentController,
);

router.patch(
  "/:id/cancel",
  privilegeMiddleware("appointment:update"),
  cancelAppointmentController,
);

router.patch(
  "/:id/status",
  privilegeMiddleware("appointment:update"),
  updateAppointmentStatusController,
);

export default router;