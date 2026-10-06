import { z } from "zod";
import { AppError } from "../lib/http.js";
import { lineItem } from "../modules/shared/validation.js";
import {
  calculateQuotation,
  transitionQuotation,
} from "../modules/quotations/service.js";
import { convertQuotationToSalesOrder } from "../modules/sales-orders/service.js";
import { prisma } from "../lib/prisma.js";
import * as quotations from "../models/quotations.model.js";

const itemSchema = lineItem.extend({
  unitPrice: z.coerce.number().nonnegative(),
});
const inputSchema = z.object({
  enquiryId: z.string().min(1),
  validUntil: z.coerce.date(),
  items: z.array(itemSchema).min(1),
});
const nextNumber = () =>
  `QT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
export const getQuotations = async (_req, res) =>
  res.json(await quotations.listQuotations());
export async function getQuotation(req, res) {
  const quotation = await quotations.findQuotation(req.params.id);
  if (!quotation) throw new AppError(404, "Quotation not found");
  res.json(quotation);
}
export async function addQuotation(req, res) {
  const input = inputSchema.parse(req.body);
  const enquiry = await quotations.findEnquiryForQuotation(input.enquiryId);
  if (!enquiry) throw new AppError(404, "Enquiry not found");
  if (enquiry.status !== "NEW")
    throw new AppError(
      409,
      "Only a new enquiry can receive its first quotation",
    );
  if (
    (await quotations.countQuotationProducts(
      input.items.map((item) => item.productId),
    )) !== input.items.length
  )
    throw new AppError(422, "One or more products do not exist");
  const { lines, grandTotal } = calculateQuotation(input.items);
  res.status(201).json(
    await quotations.createQuotationForEnquiry(
      {
        quotationNumber: nextNumber(),
        enquiryId: enquiry.id,
        customerId: enquiry.customerId,
        validUntil: input.validUntil,
        grandTotal,
        createdById: req.user.sub,
        items: { create: lines },
      },
      enquiry.id,
    ),
  );
}
export async function updateQuotationStatus(req, res) {
  const { status } = z
    .object({ status: z.enum(["SENT", "ACCEPTED", "REJECTED"]) })
    .parse(req.body);

  if (status === "SENT" && req.user.role !== "SALES") {
    throw new AppError(403, "Only sales users can send quotations");
  }
  if (["ACCEPTED", "REJECTED"].includes(status) && req.user.role !== "ADMIN") {
    throw new AppError(403, "Only administrators can review quotations");
  }

  res.json(await transitionQuotation(prisma, req.params.id, status));
}
export async function convertQuotation(req, res) {
  res
    .status(201)
    .json(
      await convertQuotationToSalesOrder(prisma, req.params.id, req.user.sub),
    );
}
