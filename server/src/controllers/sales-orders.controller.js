import { z } from "zod";
import { AppError } from "../lib/http.js";
import { prisma } from "../lib/prisma.js";
import { confirmSalesOrder, dispatchSalesOrder } from "../modules/sales-orders/service.js";
import * as orders from "../models/sales-orders.model.js";

const dispatchSchema = z.object({ vehicleNumber: z.string().min(2), driverName: z.string().min(2), dispatchDate: z.coerce.date().optional().default(() => new Date()), items: z.array(z.object({ productId: z.string().min(1), quantity: z.coerce.number().int().positive() })).min(1) });
export const getSalesOrders = async (_req, res) => res.json(await orders.listSalesOrders());
export async function getSalesOrder(req, res) { const order = await orders.findSalesOrder(req.params.id); if (!order) throw new AppError(404, "Sales order not found"); res.json(order); }
export const confirmOrder = async (req, res) => res.json(await confirmSalesOrder(prisma, req.params.id));
export const dispatchOrder = async (req, res) => res.status(201).json(await dispatchSalesOrder(prisma, req.params.id, dispatchSchema.parse(req.body)));
