import "dotenv/config";
import app from "./app.js";
import { prisma } from "./lib/prisma.js";

const port = Number(process.env.PORT || 4000);
const server = app.listen(port, () =>
  console.log(`ForgeFlow API listening on http://localhost:${port}`),
);
async function close() {
  await prisma.$disconnect();
  server.close(() => process.exit(0));
}
process.on("SIGINT", close);
process.on("SIGTERM", close);
