import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import configRoute from "./routes/config.js";
import estimateRoute from "./routes/estimate.js";
import authRoute from "./routes/auth.js";
import adminRoute from "./routes/admin.js";

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools (curl, health checks) with no Origin header.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.use("/api/config", configRoute);
app.use("/api/estimate", estimateRoute);
app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoute);

// 404 for unknown API routes
app.use("/api", (req, res) => res.status(404).json({ error: "Not found." }));

// Central error handler (covers CORS rejection and anything unexpected).
app.use((err, req, res, next) => {
  console.error("[unhandled]", err);
  res.status(err.status || 500).json({ error: err.message || "Server error." });
});

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[server] listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[server] failed to start:", err.message);
    process.exit(1);
  });
