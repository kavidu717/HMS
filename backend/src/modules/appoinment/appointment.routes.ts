import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";

import {
  createAppointment,
  getAllAppointments
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

export default router;