/**
 * Notification Service 
 *
 * Listens to Kafka events (e.g. booking-created) and sends
 * email notifications to users via Nodemailer.
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../../.env") });

const { startConsumer, stopConsumer } = require("./consumer");

/* Start the Kafka consumer */
startConsumer()
  .then(() => console.log("Notification service running..."))
  .catch((err) => {
    console.error("Failed to start consumer:", err.message);
    process.exit(1);
  });

/* Graceful shutdown on SIGINT / SIGTERM */
async function shutdown(signal) {
  console.log(`${signal} received. Shutting down...`);
  await stopConsumer().catch(() => {});
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));