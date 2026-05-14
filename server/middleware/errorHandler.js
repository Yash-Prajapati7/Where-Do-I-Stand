function errorHandler(err, req, res, next) {
  const statusCode =
    err.message === "CORS_BLOCKED"
      ? 403
      : Number(err.statusCode || err.status || 500);

  const payload = {
    error: statusCode >= 500 ? "Internal Server Error" : "Request Error",
    message:
      err.message === "CORS_BLOCKED"
        ? "Request origin is not allowed by CORS policy."
        : err.message || "Unexpected server error.",
  };

  if (process.env.NODE_ENV !== "production" && err.stack) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}

export default errorHandler;
