import { Router } from "express";
import { asyncHandler } from "../lib/http.js";
import { allowRoles } from "../middleware/auth.js";
import * as controller from "../controllers/enquiries.controller.js";
const router = Router();
router.get("/", asyncHandler(controller.getEnquiries));
router.get("/:id", asyncHandler(controller.getEnquiry));
router.post("/", allowRoles("SALES"), asyncHandler(controller.addEnquiry));
export default router;
