import express from "express";
import cors from "cors";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import openApiSpec from "./docs/openapi.js";
import authRoutes from "./routes/auth.routes.js";
import catalogRoutes from "./routes/catalog.routes.js";
import enquiryRoutes from "./routes/enquiries.routes.js";
import quotationRoutes from "./routes/quotations.routes.js";
import salesOrderRoutes from "./routes/sales-orders.routes.js";
import dispatchRoutes from "./routes/dispatches.routes.js";
import { authenticate } from "./middleware/auth.js";
import { errorHandler } from "./lib/http.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "100kb" }));
app.use(morgan("dev"));
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/api-docs.json", (_req, res) => res.json(openApiSpec));
app.use(
	"/api-docs",
	swaggerUi.serve,
	swaggerUi.setup(openApiSpec, { explorer: true }),
);
app.use("/api/auth", authRoutes);
app.use("/api", authenticate);
app.use("/api", catalogRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/sales-orders", salesOrderRoutes);
app.use("/api/dispatches", dispatchRoutes);
app.use(errorHandler);

export default app;
