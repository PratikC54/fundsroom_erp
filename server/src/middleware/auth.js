import jwt from "jsonwebtoken";
import { AppError } from "../lib/http.js";

export function authenticate(req, _res, next) {
  const token =
    req.headers.authorization?.startsWith("Bearer ") &&
    req.headers.authorization.slice(7);
  if (!token) return next(new AppError(401, "Authentication is required"));
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return next(new AppError(401, "Session is invalid or expired"));
  }
}

export const allowRoles =
  (...roles) =>
  (req, _res, next) =>
    roles.includes(req.user?.role)
      ? next()
      : next(new AppError(403, "You do not have permission for this action"));
