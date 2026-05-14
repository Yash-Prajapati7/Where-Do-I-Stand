import cors from "cors";

const configuredOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowAllOrigins = configuredOrigins.length === 0;
const allowedOrigins = new Set(configuredOrigins);

const corsHandler = cors({
  origin(origin, callback) {
    if (!origin || allowAllOrigins || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("CORS_BLOCKED"));
  },
});

export default corsHandler;
