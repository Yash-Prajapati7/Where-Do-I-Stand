function parseDuplicateKeyError(err) {
  // Handle MongoDB duplicate key errors (E11000)
  if (err.code === 11000 && err.keyPattern) {
    const keys = Object.keys(err.keyPattern);
    const dupKeyValues = err.keyValue || {};
    
    // Build a descriptive message
    const fieldNames = keys.join(", ");
    const fieldValues = keys
      .map((key) => `${key}: ${dupKeyValues[key] === null ? "empty/missing" : JSON.stringify(dupKeyValues[key])}`)
      .join(", ");
    
    return `Duplicate entry found: ${fieldNames} (${fieldValues}). This combination already exists in the system. Please check your data for duplicates.`;
  }
  return null;
}

function errorHandler(err, req, res, next) {
  let statusCode =
    err.message === "CORS_BLOCKED"
      ? 403
      : Number(err.statusCode || err.status || 500);

  let message = err.message || "Unexpected server error.";

  // Handle MongoDB duplicate key error
  if (err.code === 11000) {
    statusCode = 409; // Conflict
    const parsedMessage = parseDuplicateKeyError(err);
    message = parsedMessage || "A duplicate entry was detected. Please check your data for duplicates.";
  }

  const payload = {
    error: statusCode >= 500 ? "Internal Server Error" : "Request Error",
    message:
      err.message === "CORS_BLOCKED"
        ? "Request origin is not allowed by CORS policy."
        : message,
  };

  if (process.env.NODE_ENV !== "production" && err.stack) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}

export default errorHandler;
