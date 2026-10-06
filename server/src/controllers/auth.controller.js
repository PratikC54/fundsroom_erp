import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { AppError } from "../lib/http.js";
import { findUserByEmail } from "../models/auth.model.js";

export async function login(req, res) {
  const { email, password } = z
    .object({ email: z.string().email(), password: z.string().min(1) })
    .parse(req.body);
  const user = await findUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    throw new AppError(401, "Invalid email or password");
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "8h" },
  );
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}
