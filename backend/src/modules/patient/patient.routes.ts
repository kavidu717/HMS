import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { privilegeMiddleware } from "../../middleware/privilege.middleware.js";
import {
  createPatient,
  updatePatient,
  getPatientById,
  searchPatients
} from "./patient.controller.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  privilegeMiddleware("patient:create"),
  createPatient
);

router.get(
  "/search",
  privilegeMiddleware("patient:read"),
  searchPatients
);

router.get(
  "/:id",
  privilegeMiddleware("patient:read"),
  getPatientById
);

router.put(
  "/:id",
  privilegeMiddleware("patient:update"),
  updatePatient
);

export default router;