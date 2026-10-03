import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware.js";
import { privilegeMiddleware } from "../../middleware/privilege.middleware.js";

import { uploadPatientDocument } from "../../config/multer.js";
import {
    getPatientDocumentsController,
  uploadPatientDocument as uploadPatientDocumentController
} from "./patient-document.controller.js";

const router = Router();

router.use(authMiddleware);


router.get(
  "/:patientId/documents",
  privilegeMiddleware("patient_document:read"),
  getPatientDocumentsController
);

router.post(
  "/:patientId/documents",
  privilegeMiddleware("patient_document:create"),
  uploadPatientDocument.single("file"),
  uploadPatientDocumentController
);

export default router;