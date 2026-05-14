import mongoose from "mongoose";

const DEFAULT_MONGO_URI = "mongodb://127.0.0.1:27017/wdis";

let hasConnectedOnce = false;

export async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI || DEFAULT_MONGO_URI;

  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    console.log("[Database] Database already connected");
    return mongoose.connection;
  }

  try {
    console.log(`[Database] Connecting to MongoDB`);
    
    await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB_NAME || undefined,
      autoIndex: process.env.NODE_ENV !== "production",
    });

    hasConnectedOnce = true;
    const status = getDatabaseStatus();
    console.log(`[Database] MongoDB connected successfully`);
    
    return mongoose.connection;
  } catch (error) {
    console.error("[Database] MongoDB connection failed:", error.message);
    throw error;
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState === 0) {
    console.log("[Database] Database already disconnected");
    return;
  }

  try {
    console.log("[Database] Disconnecting from MongoDB...");
    await mongoose.disconnect();
    console.log("[Database] MongoDB disconnected successfully");
  } catch (error) {
    console.error("[Database] MongoDB disconnection failed:", error.message);
    throw error;
  }
}

export function getDatabaseStatus() {
  const state = mongoose.connection.readyState;
  const stateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  return {
    status: stateMap[state] || "unknown",
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
    hasConnectedOnce,
  };
}
