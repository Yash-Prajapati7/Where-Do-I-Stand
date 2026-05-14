export function createHttpError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function assert(condition, message, statusCode = 400) {
  if (!condition) {
    throw createHttpError(message, statusCode);
  }
}
