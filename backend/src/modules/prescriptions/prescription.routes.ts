import { Router } from "express";

import {
  createPrescription,
  getAllPrescriptions,
  getPrescriptionById,
  getPatientPrescriptions,
  updatePrescription,
  updatePrescriptionStatus
} from "./ prescription.controller.js";

import { authMiddleware } from "../../middleware/auth.middleware.js";
import { privilegeMiddleware } from "../../middleware/privilege.middleware.js";

const router = Router();

// All prescription routes require authentication.
router.use(authMiddleware);

// Create a prescription.
router.post(
  "/",
  privilegeMiddleware("prescription:create"),
  createPrescription
);

// Get all prescriptions.
router.get(
  "/",
  privilegeMiddleware("prescription:read"),
  getAllPrescriptions
);

// Get prescriptions belonging to a patient.
router.get(
  "/patient/:patientId",
  privilegeMiddleware("prescription:read"),
  getPatientPrescriptions
);

// Get a prescription by ID.
router.get(
  "/:id",
  privilegeMiddleware("prescription:read"),
  getPrescriptionById
);

// Update prescription details.
router.patch(
  "/:id",
  privilegeMiddleware("prescription:update"),
  updatePrescription
);

// Update prescription status.
router.patch(
  "/:id/status",
  privilegeMiddleware("prescription:update"),
  updatePrescriptionStatus
);

export default router;