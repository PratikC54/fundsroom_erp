import { prisma } from "../lib/prisma.js";

export const listCustomers = () =>
  prisma.customer.findMany({ orderBy: { companyName: "asc" } });
export const createCustomer = (data) => prisma.customer.create({ data });
export const listProducts = () =>
  prisma.product.findMany({
    include: { inventory: true },
    orderBy: { productCode: "asc" },
  });
export const createProduct = ({ physicalQuantity, ...product }) =>
  prisma.product.create({
    data: { ...product, inventory: { create: { physicalQuantity } } },
    include: { inventory: true },
  });
export const listInventory = () =>
  prisma.inventory.findMany({
    include: { product: true },
    orderBy: { product: { productCode: "asc" } },
  });
export const findInventory = (productId) =>
  prisma.inventory.findUnique({ where: { productId } });
export const updateInventory = (productId, data) =>
  prisma.inventory.update({ where: { productId }, data });
