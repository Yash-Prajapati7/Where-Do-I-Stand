import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

import app from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });
dotenv.config();

const port = Number(process.env.BACKEND_PORT || 8080);
let server = null;

async function startServer() {
  try {
    await connectDatabase();

    server = app.listen(port, () => {
      console.log(`WDIS backend listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start backend server:", error);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`Received ${signal}. Shutting down gracefully.`);

  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  await disconnectDatabase();
  console.log("Disconnected database")
  process.exit(0);
}

process.on("SIGINT", () => {
  shutdown("SIGINT").catch((error) => {
    console.error("Shutdown error:", error);
    process.exit(1);
  });
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM").catch((error) => {
    console.error("Shutdown error:", error);
    process.exit(1);
  });
});

startServer();
