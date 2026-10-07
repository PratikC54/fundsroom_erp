import { prisma } from "../lib/prisma.js";

const dispatchInclude = {
  salesOrder: { include: { customer: true } },
  items: { include: { product: true } },
};
export const listDispatches = () =>
  prisma.dispatch.findMany({
    include: dispatchInclude,
    orderBy: { createdAt: "desc" },
  });
export const findDispatch = (id) =>
  prisma.dispatch.findUnique({ where: { id }, include: dispatchInclude });
