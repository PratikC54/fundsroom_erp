import { Prisma } from "@prisma/client";
import { AppError } from "../../lib/http.js";

const orderNumber = () =>
  `SO-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
const dispatchNumber = () =>
  `DSP-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
const orderInclude = {
  customer: true,
  quotation: { include: { enquiry: true } },
  items: { include: { product: true, dispatchItems: true } },
  dispatches: { include: { items: true } },
};

export async function convertQuotationToSalesOrder(
  client,
  quotationId,
  userId,
) {
  return client.$transaction(async (tx) => {
    const quotation = await tx.quotation.findUnique({
      where: { id: quotationId },
      include: { items: true, enquiry: true },
    });
    if (!quotation) throw new AppError(404, "Quotation not found");
    if (quotation.status !== "ACCEPTED")
      throw new AppError(
        409,
        "Only accepted quotations can be converted to a sales order",
      );
    const existing = await tx.salesOrder.findUnique({ where: { quotationId } });
    if (existing)
      throw new AppError(
        409,
        "A sales order already exists for this quotation",
      );
    const order = await tx.salesOrder.create({
      data: {
        orderNumber: orderNumber(),
        quotationId,
        customerId: quotation.customerId,
        totalAmount: quotation.grandTotal,
        createdById: userId,
        items: {
          create: quotation.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineAmount: item.lineAmount,
          })),
        },
      },
      include: orderInclude,
    });
    await tx.enquiry.update({
      where: { id: quotation.enquiryId },
      data: { status: "WON" },
    });
    return order;
  });
}

/** Central rule: this is the only availability calculation used by reservation logic. */
export const availableQuantity = (inventory) =>
  inventory.physicalQuantity -
  inventory.reservedQuantity -
  inventory.damagedQuantity;

export async function confirmSalesOrder(client, orderId) {
  return client.$transaction(
    async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: { id: orderId },
        include: { items: true },
      });
      if (!order) throw new AppError(404, "Sales order not found");
      if (order.status !== "PENDING")
        throw new AppError(409, "Only pending sales orders can be confirmed");
      const productIds = [
        ...new Set(order.items.map((item) => item.productId)),
      ].sort();
      // The lock occurs before availability is read. Ordered locks avoid cross-order deadlocks.
      const inventories = await tx.$queryRaw(
        Prisma.sql`SELECT * FROM "Inventory" WHERE "productId" IN (${Prisma.join(productIds)}) ORDER BY "productId" FOR UPDATE`,
      );
      if (inventories.length !== productIds.length)
        throw new AppError(
          422,
          "Inventory is missing for one or more products",
        );
      const inventoryByProduct = new Map(
        inventories.map((record) => [record.productId, record]),
      );
      for (const item of order.items) {
        const inventory = inventoryByProduct.get(item.productId);
        if (availableQuantity(inventory) < item.quantity)
          throw new AppError(
            422,
            `Insufficient available stock for product ${item.productId}`,
          );
      }
      await Promise.all(
        order.items.map((item) =>
          tx.inventory.update({
            where: { productId: item.productId },
            data: { reservedQuantity: { increment: item.quantity } },
          }),
        ),
      );
      return tx.salesOrder.update({
        where: { id: orderId },
        data: { status: "CONFIRMED" },
        include: orderInclude,
      });
    },
    { isolationLevel: "Serializable" },
  );
}

export async function dispatchSalesOrder(client, orderId, details) {
  return client.$transaction(
    async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: { id: orderId },
        include: { items: { include: { dispatchItems: true } } },
      });
      if (!order) throw new AppError(404, "Sales order not found");
      if (order.status !== "CONFIRMED")
        throw new AppError(
          409,
          "Only confirmed sales orders can be dispatched",
        );
      const itemByProduct = new Map(
        order.items.map((item) => [item.productId, item]),
      );
      if (
        new Set(details.items.map((item) => item.productId)).size !==
        details.items.length
      )
        throw new AppError(422, "A product can appear only once in a dispatch");
      for (const line of details.items) {
        const orderItem = itemByProduct.get(line.productId);
        if (!orderItem)
          throw new AppError(
            422,
            "A dispatch product is not part of this sales order",
          );
        const alreadyDispatched = orderItem.dispatchItems.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );
        if (line.quantity > orderItem.quantity - alreadyDispatched)
          throw new AppError(
            422,
            "Dispatch quantity exceeds remaining order quantity",
          );
      }
      const productIds = details.items.map((item) => item.productId).sort();
      const inventories = await tx.$queryRaw(
        Prisma.sql`SELECT * FROM "Inventory" WHERE "productId" IN (${Prisma.join(productIds)}) ORDER BY "productId" FOR UPDATE`,
      );
      const inventoryByProduct = new Map(
        inventories.map((record) => [record.productId, record]),
      );
      for (const line of details.items) {
        const inventory = inventoryByProduct.get(line.productId);
        if (
          !inventory ||
          inventory.reservedQuantity < line.quantity ||
          inventory.physicalQuantity < line.quantity
        )
          throw new AppError(
            422,
            "Cannot dispatch more than reserved physical stock",
          );
      }
      const dispatch = await tx.dispatch.create({
        data: {
          dispatchNumber: dispatchNumber(),
          salesOrderId: orderId,
          vehicleNumber: details.vehicleNumber,
          driverName: details.driverName,
          dispatchDate: details.dispatchDate,
          items: {
            create: details.items.map((line) => ({
              productId: line.productId,
              quantity: line.quantity,
              salesOrderItemId: itemByProduct.get(line.productId).id,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });
      await Promise.all(
        details.items.map((line) =>
          tx.inventory.update({
            where: { productId: line.productId },
            data: {
              physicalQuantity: { decrement: line.quantity },
              reservedQuantity: { decrement: line.quantity },
            },
          }),
        ),
      );
      const allDone = order.items.every((item) => {
        const nowDispatched =
          item.dispatchItems.reduce(
            (sum, dispatched) => sum + dispatched.quantity,
            0,
          ) +
          (details.items.find((line) => line.productId === item.productId)
            ?.quantity || 0);
        return nowDispatched === item.quantity;
      });
      if (allDone)
        await tx.salesOrder.update({
          where: { id: orderId },
          data: { status: "DISPATCHED" },
        });
      return dispatch;
    },
    { isolationLevel: "Serializable" },
  );
}

export { orderInclude };
