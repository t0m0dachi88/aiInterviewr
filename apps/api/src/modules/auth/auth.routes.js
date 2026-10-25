import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { validateBody, validators } from "../../middleware/validate.middleware.js";
import { authenticate } from "../../middleware/authenticate.middleware.js";
import { csrfProtection } from "../../middleware/csrf.middleware.js";
import { authRateLimit } from "../../middleware/rate-limit.middleware.js";

const router = Router();

router.post(
  "/register",
  authRateLimit,
  validateBody({
    name: validators.displayName,
    email: validators.email,
    password: validators.password,
  }),
  (req, _res, next) => {
    req.validated.displayName = req.validated.name;
    next();
  },
  AuthController.register,
);

router.post(
  "/login",
  authRateLimit,
  validateBody({
    email: validators.email,
    password: validators.loginPassword,
  }),
  AuthController.login,
);

router.post("/refresh", csrfProtection, AuthController.refresh);

router.post("/logout", csrfProtection, AuthController.logout);

router.post(
  "/logout-all",
  authenticate,
  csrfProtection,
  AuthController.logoutAll,
);

router.get("/me", authenticate, AuthController.me);

export default router;
