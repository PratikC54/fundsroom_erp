import { z } from "zod";

export const id = z.string().min(1);
export const quantity = z.coerce.number().int().positive();
export const date = z.coerce.date();
export const money = z.coerce.number().nonnegative();
export const lineItem = z.object({
  productId: id,
  quantity,
  unitPrice: money.optional(),
  discountPct: z.coerce.number().min(0).max(100).optional(),
  gstPct: z.coerce.number().min(0).max(100).optional(),
});
export const parse = (schema, value) => schema.parse(value);
