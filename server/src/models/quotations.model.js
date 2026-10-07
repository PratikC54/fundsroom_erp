import { prisma } from "../lib/prisma.js";

export const quotationInclude = {
  customer: true,
  enquiry: true,
  items: { include: { product: true } },
  salesOrder: true,
};
export const listQuotations = () =>
  prisma.quotation.findMany({
    include: quotationInclude,
    orderBy: { createdAt: "desc" },
  });
export const findQuotation = (id) =>
  prisma.quotation.findUnique({ where: { id }, include: quotationInclude });
export const findEnquiryForQuotation = (id) =>
  prisma.enquiry.findUnique({ where: { id }, include: { items: true } });
export const countQuotationProducts = (ids) =>
  prisma.product.count({ where: { id: { in: ids } } });
export const createQuotationForEnquiry = (data, enquiryId) =>
  prisma.$transaction(async (tx) => {
    const quotation = await tx.quotation.create({
      data,
      include: quotationInclude,
    });
    await tx.enquiry.update({
      where: { id: enquiryId },
      data: { status: "QUOTED" },
    });
    return quotation;
  });
