
import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { privilegeMiddleware } from "../../middleware/privilege.middleware.js";
import {
  createInvoice,
  getAllInvoices,
  getInvoiceById,
  getPatientInvoices,
  recordPayment,
} from "./billing.controller.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/invoices",
  privilegeMiddleware("billing:create"),
  createInvoice,
);

router.get(
  "/invoices",
  privilegeMiddleware("billing:read"),
  getAllInvoices,
);

router.get(
  "/invoices/:id",
  privilegeMiddleware("billing:read"),
  getInvoiceById,
);

router.get(
  "/patients/:patientId/invoices",
  privilegeMiddleware("billing:read"),
  getPatientInvoices,
);

router.post(
  "/payments",
  privilegeMiddleware("billing:create"),
  recordPayment,
);

export default router;
