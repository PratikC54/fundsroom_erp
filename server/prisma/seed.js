import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const products = [
  ["RM-STEEL-01", "Mild Steel Sheet 2mm", "Raw Material", "Sheet", 2850, 240],
  ["RM-BOLT-12", "Hex Bolt M12 x 60", "Fasteners", "Piece", 42, 1200],
  ["EL-MOTOR-2", "Industrial Motor 2HP", "Electrical", "Piece", 12800, 32],
  ["PN-GEAR-45", "Helical Gear Assembly", "Machined Parts", "Piece", 4650, 90],
  ["PK-WOOD-01", "Export Plywood Crate", "Packaging", "Piece", 680, 150],
  ["RM-PIPE-25", "GI Pipe 25mm", "Raw Material", "Metre", 320, 500],
];

async function main() {
  const passwordHash = await bcrypt.hash("Welcome@123", 12);
  await prisma.user.upsert({
    where: { email: "admin@fundsroom.local" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@fundsroom.local",
      passwordHash,
      role: "ADMIN",
    },
  });
  await prisma.user.upsert({
    where: { email: "sales@fundsroom.local" },
    update: {},
    create: {
      name: "Sales User",
      email: "sales@fundsroom.local",
      passwordHash,
      role: "SALES",
    },
  });
  for (const [
    productCode,
    name,
    category,
    unit,
    basePrice,
    physicalQuantity,
  ] of products) {
    await prisma.product.upsert({
      where: { productCode },
      update: {},
      create: {
        productCode,
        name,
        category,
        unit,
        basePrice,
        inventory: { create: { physicalQuantity } },
      },
    });
  }
  await prisma.customer.upsert({
    where: { email: "purchase@novamech.in" },
    update: {},
    create: {
      companyName: "Nova Mech Systems",
      contactPerson: "Pratik",
      mobile: "9876543210",
      email: "purchase@novamech.in",
      city: "Pune",
    },
  });
  console.log(
    "Seed completed. Admin: admin@fundsrrom.local / Welcome@123; Sales: sales@fundsrrom.local / Welcome@123",
  );
}
main().finally(() => prisma.$disconnect());
