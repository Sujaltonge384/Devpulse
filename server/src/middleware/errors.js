export function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  return next(error);
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error?.code === 11000) {
    return res.status(409).json({ success: false, message: "A record with that value already exists." });
  }

  if (error?.name === "ValidationError" || error?.name === "CastError") {
    return res.status(400).json({ success: false, message: error.message || "The submitted data is invalid." });
  }

  const status = Number(error?.statusCode) || 500;
  if (process.env.NODE_ENV !== "production") {
    console.error(error);
  } else if (status >= 500) {
    console.error(`${req.method} ${req.originalUrl}:`, error?.message || "Unknown server error");
  }

  return res.status(status).json({
    success: false,
    message: status >= 500 && process.env.NODE_ENV === "production"
      ? "Internal server error. Check the backend logs for details."
      : error?.message || "Something went wrong."
  });
}
