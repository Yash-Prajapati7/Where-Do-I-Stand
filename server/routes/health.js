import { Router } from "express";

import { getDatabaseStatus } from "../config/database.js";

const router = Router();

router.get("/health", (req, res) => {
  const database = getDatabaseStatus();

  res.status(200).json({
    status: database.status === "connected" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    database,
  });
});

export default router;
