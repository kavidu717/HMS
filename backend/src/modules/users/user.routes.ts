import {Router} from "express";
import { createUser, getRoles, getUserById, getUsers } from "./user.controller.js";
import { privilegeMiddleware } from "../../middleware/privilege.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";


const router = Router();



router.use(authMiddleware);


router.post(
  "/",
  privilegeMiddleware("user:create"),
  createUser
);

router.get(
  "/",
  privilegeMiddleware("user:read"),
  getUsers
);

router.get(
  "/roles",
  privilegeMiddleware("user:read"),
  getRoles
);
router.get(
  "/:id",
  privilegeMiddleware("user:read"),
  getUserById
);

export default router;