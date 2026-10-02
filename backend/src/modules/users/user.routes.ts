import {Router} from "express";
import { createUser } from "./user.controller.js";
import { privilegeMiddleware } from "../../middleware/privilege.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";


const router = Router();



router.use(authMiddleware);


router.post(
  "/",
  privilegeMiddleware("user:create"),
  createUser
);

export default router;