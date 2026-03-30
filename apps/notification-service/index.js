const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const { startConsumer, stopConsumer } = require("./consumer");

async function main() {
  console.log("");
  console.log("  SmartCampus — Notification Service");
  console.log("");
  console.log(
    `  Kafka Broker : ${process.env.KAFKA_BROKER || "localhost:9092"}`,
  );
  console.log(
    `  SMTP Active  : ${process.env.SMTP_HOST ? "Yes" : "No (simulation mode)"}`,
  );
  console.log("\n");

  try {
    await startConsumer();
    console.log(
      "App: Notification service is running. Waiting for BookingCreated events...\n",
    );
  } catch (err) {
    console.error("App: Failed to start consumer:", err.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`\nApp: ${signal} received. Shutting down gracefully...`);
  try {
    await stopConsumer();
  } catch (err) {
    console.error("App: Error during shutdown:", err.message);
  }
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

main();
