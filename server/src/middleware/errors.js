export function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, req, res, next) {
  if (error?.code === 11000) {
    return res.status(409).json({ success: false, message: "An account with this email already exists." });
  }
  const status = error.statusCode || 500;
  if (process.env.NODE_ENV !== "production") console.error(error);
  res.status(status).json({
    success: false,
    message: status === 500 && process.env.NODE_ENV === "production"
      ? "Internal server error"
      : error.message || "Something went wrong"
  });
}
