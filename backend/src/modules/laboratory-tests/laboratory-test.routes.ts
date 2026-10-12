import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { privilegeMiddleware } from "../../middleware/privilege.middleware.js";
import {
  createLaboratoryTestController,
  deactivateLaboratoryTestController,
  getLaboratoryTestByIdController,
  getLaboratoryTestsController,
  updateLaboratoryTestController,
} from "./laboratory-test.controller.js";

const router = Router();

router.use(authMiddleware);

router.post(
  "/",
  privilegeMiddleware("laboratory:create"),
  createLaboratoryTestController,
);


router.get(
  "/",
  privilegeMiddleware("laboratory:read"),
  getLaboratoryTestsController,
);


router.get(
  "/:id",
  privilegeMiddleware("laboratory:read"),
  getLaboratoryTestByIdController,
);

router.patch(
  "/:id/deactivate",
  privilegeMiddleware("laboratory:update"),
  deactivateLaboratoryTestController,
);



router.patch(
  "/:id",
  privilegeMiddleware("laboratory:update"),
  updateLaboratoryTestController,
);








export default router;