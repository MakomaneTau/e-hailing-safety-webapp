import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import { authenticate } from "../../middleware/authenticate";
import { validateBody } from "../../middleware/validate";
import {
  loginController,
  logoutAllController,
  logoutController,
  meController,
  signupController,
} from "./auth.controller";
import {
  loginSchema,
  signupSchema,
} from "./auth.schema";

export const authRouter = Router();

const authenticationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts",
  },
});

authRouter.post(
  "/signup",
  authenticationLimiter,
  validateBody(signupSchema),
  signupController,
);

authRouter.post(
  "/login",
  authenticationLimiter,
  validateBody(loginSchema),
  loginController,
);

authRouter.post(
  "/logout",
  authenticate,
  logoutController,
);

authRouter.post(
  "/logout-all",
  authenticate,
  logoutAllController,
);

authRouter.get(
  "/me",
  authenticate,
  meController,
);