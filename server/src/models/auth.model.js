import { prisma } from "../lib/prisma.js";

export const findUserByEmail = (email) =>
  prisma.user.findUnique({ where: { email } });
