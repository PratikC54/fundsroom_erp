import { Router } from "express";
import { asyncHandler } from "../lib/http.js";
import { allowRoles } from "../middleware/auth.js";
import * as controller from "../controllers/catalog.controller.js";
const router = Router();
router.get("/customers", asyncHandler(controller.getCustomers));
router.post(
  "/customers",
  allowRoles("SALES"),
  asyncHandler(controller.addCustomer),
);
router.get("/products", asyncHandler(controller.getProducts));
router.post(
  "/products",
  allowRoles("ADMIN"),
  asyncHandler(controller.addProduct),
);
router.get("/inventory", asyncHandler(controller.getInventory));
router.patch(
  "/inventory/:productId",
  allowRoles("ADMIN"),
  asyncHandler(controller.reviseInventory),
);
export default router;
