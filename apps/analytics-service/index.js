const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

process.env.KAFKAJS_NO_PARTITIONER_WARNING = "1";

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
  console.log("SmartCampus    : Analytics Service");
  console.log(`  Port         : ${PORT}`);
  console.log(
    `  Kafka Broker : ${process.env.KAFKA_BROKER || "localhost:9092"}`,
  );
  console.log(`  MongoDB      : Atlas`);

  await mongoose.connect(process.env.MONGO_URI, { dbName: "campus-analytics" });
  console.log("Server: Connected to MongoDB Atlas → campus-analytics");

  await startConsumer();

  app.listen(PORT, () => {
    console.log(`App: Analytics service running on port ${PORT}`);
    console.log(`App: GET http://localhost:${PORT}/api/analytics/peak-hours\n`);
  });
}

async function shutdown(signal) {
  console.log(`\n[Server] ${signal} received. Shutting down...`);
  try {
    await stopConsumer();
    await mongoose.connection.close();
  } catch (err) {
    console.error("App: Shutdown error:", err.message);
  }
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start().catch((err) => {
  console.error("App: Failed to start:", err.message);
  process.exit(1);
});
