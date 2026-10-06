import { z } from "zod";
import { AppError } from "../lib/http.js";
import { withInventoryAvailable } from "../lib/serializers.js";
import * as catalog from "../models/catalog.model.js";

const customerSchema = z.object({ companyName: z.string().min(2), contactPerson: z.string().min(2), mobile: z.string().min(6), email: z.string().email(), city: z.string().min(2) });
const productSchema = z.object({ productCode: z.string().min(2), name: z.string().min(2), category: z.string().min(2), unit: z.string().min(1), basePrice: z.coerce.number().nonnegative(), physicalQuantity: z.coerce.number().int().min(0).optional() });
const inventorySchema = z.object({ physicalQuantity: z.coerce.number().int().min(0), damagedQuantity: z.coerce.number().int().min(0).default(0) });

export const getCustomers = async (_req, res) => res.json(await catalog.listCustomers());
export const addCustomer = async (req, res) => res.status(201).json(await catalog.createCustomer(customerSchema.parse(req.body)));
export const getProducts = async (_req, res) => res.json(await catalog.listProducts());
export async function addProduct(req, res) {
  const { physicalQuantity = 0, ...product } = productSchema.parse(req.body);
  res.status(201).json(await catalog.createProduct({ ...product, physicalQuantity }));
}
export async function getInventory(_req, res) { res.json((await catalog.listInventory()).map(withInventoryAvailable)); }
export async function reviseInventory(req, res) {
  const data = inventorySchema.parse(req.body);
  const current = await catalog.findInventory(req.params.productId);
  if (!current) throw new AppError(404, "Inventory record not found");
  if (data.physicalQuantity < current.reservedQuantity + data.damagedQuantity) throw new AppError(422, "Physical quantity cannot be less than reserved and damaged quantity");
  res.json(withInventoryAvailable(await catalog.updateInventory(req.params.productId, data)));
}
