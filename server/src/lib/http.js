export class AppError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function errorHandler(error, _req, res, _next) {
  if (error?.name === "ZodError")
    return res
      .status(422)
      .json({ error: "Validation failed", details: error.issues });
  if (error?.code === "P2002")
    return res
      .status(409)
      .json({ error: "A record with this value already exists" });
  if (error?.code === "P2025")
    return res.status(404).json({ error: "Record not found" });
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  return res
    .status(status)
    .json({
      error: status >= 500 ? "Unexpected server error" : error.message,
      details: error.details,
    });
}
