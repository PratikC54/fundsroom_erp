import { Router } from "express";
import { asyncHandler } from "../lib/http.js";
import * as controller from "../controllers/dispatches.controller.js";
const router = Router();
router.get("/", asyncHandler(controller.getDispatches));
router.get("/:id", asyncHandler(controller.getDispatch));
export default router;
