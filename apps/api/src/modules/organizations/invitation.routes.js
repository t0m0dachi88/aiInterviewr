import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import {
  validateBody,
  validators,
} from "../../middleware/validate.middleware.js";
import { OrganizationController } from "./organization.controller.js";

const router = Router();

router.use(authenticate);

router.post("/:token/accept", OrganizationController.acceptInvitation);

router.post(
  "/accept",
  validateBody({
    token: validators.invitationToken,
  }),
  OrganizationController.acceptInvitation,
);

export default router;
