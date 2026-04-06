/**
 * Analytics Service
 * Connects to MongoDB Atlas, starts the Kafka consumer,
 * and exposes REST endpoints for booking analytics.
 */

require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const { startConsumer, stopConsumer } = require("./consumer");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();
const PORT = process.env.ANALYTICS_PORT || 5004;

app.use(cors());
app.use(express.json());
app.use("/api/analytics", analyticsRoutes);

async function start() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: "campus-analytics" });
  console.log("Analytics: Connected to MongoDB Atlas → campus-analytics");

  await startConsumer();

  app.listen(PORT, () => {
    console.log(`Analytics: Running on port ${PORT}`);
    console.log(
      `Analytics: GET http://localhost:${PORT}/api/analytics/peak-hours\n`,
    );
  });
}

/* Graceful shutdown on SIGINT / SIGTERM */
async function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);
  await stopConsumer().catch(() => {});
  await mongoose.connection.close().catch(() => {});
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start().catch((err) => {
  console.error("Analytics: Failed to start:", err.message);
  process.exit(1);
});
