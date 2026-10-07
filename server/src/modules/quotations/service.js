import { Decimal } from "@prisma/client/runtime/library";
import { AppError } from "../../lib/http.js";

const toMoney = (value) => new Decimal(value).toDecimalPlaces(2);

export function calculateQuotation(items) {
  const lines = items.map((item) => {
    const baseAmount = toMoney(item.quantity).mul(item.unitPrice);
    const afterDiscount = baseAmount.mul(
      new Decimal(1).minus(new Decimal(item.discountPct || 0).div(100)),
    );
    const lineAmount = afterDiscount
      .mul(new Decimal(1).plus(new Decimal(item.gstPct ?? 18).div(100)))
      .toDecimalPlaces(2);
    return {
      ...item,
      unitPrice: toMoney(item.unitPrice),
      discountPct: toMoney(item.discountPct || 0),
      gstPct: toMoney(item.gstPct ?? 18),
      lineAmount,
    };
  });
  return {
    lines,
    grandTotal: lines
      .reduce((total, line) => total.plus(line.lineAmount), new Decimal(0))
      .toDecimalPlaces(2),
  };
}

export async function transitionQuotation(prisma, quotationId, nextStatus) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: quotationId },
  });
  if (!quotation) throw new AppError(404, "Quotation not found");
  const allowed = {
    DRAFT: ["SENT", "ACCEPTED", "REJECTED"],
    SENT: ["ACCEPTED", "REJECTED"],
  };
  if (!allowed[quotation.status]?.includes(nextStatus))
    throw new AppError(
      409,
      `Cannot change ${quotation.status} quotation to ${nextStatus}`,
    );
  return prisma.quotation.update({
    where: { id: quotationId },
    data: { status: nextStatus },
  });
}
