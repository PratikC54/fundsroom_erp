import { prisma } from "../lib/prisma.js";
import { orderInclude } from "../modules/sales-orders/service.js";

export const listSalesOrders = () =>
  prisma.salesOrder.findMany({
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });
export const findSalesOrder = (id) =>
  prisma.salesOrder.findUnique({ where: { id }, include: orderInclude });
