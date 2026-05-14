import compression from "compression";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";

import corsHandler from "./middleware/corsHandler.js";
import errorHandler from "./middleware/errorHandler.js";
import adminRoutes from "./routes/admin.js";
import healthRoutes from "./routes/health.js";
import processRoutes from "./routes/process.js";

const app = express();

function shouldSkipCompression(req) {
  const acceptsEventStream = String(req.headers.accept || "").includes(
    "text/event-stream"
  );

  return acceptsEventStream || req.path.endsWith("/events");
}

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please retry in a moment.",
  },
});

app.use(helmet());
app.use(
  compression({
    filter(req, res) {
      if (shouldSkipCompression(req)) {
        return false;
      }

      return compression.filter(req, res);
    },
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(corsHandler);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/api", apiLimiter);
app.use("/api", healthRoutes);
app.use("/api", processRoutes);
app.use("/api", adminRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested route does not exist.",
  });
});

app.use(errorHandler);

export default app;
