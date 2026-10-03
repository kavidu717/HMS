import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { privilegeMiddleware } from "../../middleware/privilege.middleware.js";
import {
  createMedicalRecord,
  getMedicalRecordById,
  getPatientMedicalHistory,
  updateMedicalRecord
} from "./medical-record.controller.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  privilegeMiddleware("medical_record:create"),
  createMedicalRecord
);

router.get(
  "/patient/:patientId",
  privilegeMiddleware("medical_record:read"),
  getPatientMedicalHistory
);

router.get(
  "/:id",
  privilegeMiddleware("medical_record:read"),
  getMedicalRecordById
);

router.put(
  "/:id",
  privilegeMiddleware("medical_record:update"),
  updateMedicalRecord
);

export default router;