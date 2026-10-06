import { z } from "zod";
import { AppError } from "../lib/http.js";
import { lineItem } from "../modules/shared/validation.js";
import * as enquiries from "../models/enquiries.model.js";

const inputSchema = z.object({ customerId: z.string().min(1), enquiryDate: z.coerce.date(), requiredDate: z.coerce.date(), notes: z.string().max(1000).optional(), items: z.array(lineItem.pick({ productId: true, quantity: true })).min(1) });
const nextNumber = () => `ENQ-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
export const getEnquiries = async (_req, res) => res.json(await enquiries.listEnquiries());
export async function getEnquiry(req, res) { const enquiry = await enquiries.findEnquiry(req.params.id); if (!enquiry) throw new AppError(404, "Enquiry not found"); res.json(enquiry); }
export async function addEnquiry(req, res) {
  const data = inputSchema.parse(req.body);
  if (data.requiredDate < data.enquiryDate) throw new AppError(422, "Required date must be on or after enquiry date");
  if (await enquiries.countProducts(data.items.map((item) => item.productId)) !== data.items.length) throw new AppError(422, "One or more products do not exist");
  res.status(201).json(await enquiries.createEnquiry({ ...data, enquiryNumber: nextNumber(), createdById: req.user.sub, items: { create: data.items } }));
}
