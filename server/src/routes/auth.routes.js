import { Router } from "express";
import { asyncHandler } from "../lib/http.js";
import { login } from "../controllers/auth.controller.js";
const router = Router();
router.post("/login", asyncHandler(login));
export default router;
