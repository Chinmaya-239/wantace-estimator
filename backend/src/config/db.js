import mongoose from "mongoose";

let connectPromise = null;

/**
 * Connects to MongoDB once and reuses the connection across the process.
 * Safe to call multiple times (e.g. from server.js and seed.js).
 */
export function connectDB() {
  if (connectPromise) return connectPromise;

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error(
      "MONGO_URI is not set. Copy backend/.env.example to backend/.env and fill it in."
    );
  }

  mongoose.set("strictQuery", true);

  connectPromise = mongoose
    .connect(uri)
    .then((conn) => {
      console.log(`[db] connected to MongoDB at ${conn.connection.host}`);
      return conn;
    })
    .catch((err) => {
      connectPromise = null; // allow retry on next call
      console.error("[db] connection failed:", err.message);
      throw err;
    });

  return connectPromise;
}
