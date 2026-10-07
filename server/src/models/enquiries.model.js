import { prisma } from "../lib/prisma.js";

export const enquiryInclude = {
  customer: true,
  items: { include: { product: true } },
  createdBy: { select: { id: true, name: true, email: true } },
};
export const listEnquiries = () =>
  prisma.enquiry.findMany({
    include: enquiryInclude,
    orderBy: { createdAt: "desc" },
  });
export const findEnquiry = (id) =>
  prisma.enquiry.findUnique({ where: { id }, include: enquiryInclude });
export const countProducts = (ids) =>
  prisma.product.count({ where: { id: { in: ids } } });
export const createEnquiry = (data) =>
  prisma.enquiry.create({ data, include: enquiryInclude });
