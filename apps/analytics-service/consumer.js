const { Kafka, logLevel } = require("kafkajs");
const AnalyticsBooking = require("./models/AnalyticsBooking");

const KAFKA_BROKER = process.env.KAFKA_BROKER || "localhost:9092";
const TOPIC = "booking-created";
const GROUP_ID = "analytics-service-group";

const kafka = new Kafka({
  clientId: "analytics-service",
  brokers: [KAFKA_BROKER],
  logLevel: logLevel.ERROR,
  retry: {
    initialRetryTime: 3000,
    retries: 10,
  },
});

const consumer = kafka.consumer({
  groupId: GROUP_ID,
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

/**
 * Connects to Kafka, subscribes to "booking-created", and persists
 * each event into the analytics service's own MongoDB collection.
 */
async function startConsumer() {
  await consumer.connect();
  console.log(`Analytics Consumer: ${KAFKA_BROKER} Connected to Kafka`);

  await consumer.subscribe({ topic: TOPIC, fromBeginning: true });
  console.log(
    `Analytics Consumer: ${KAFKA_BROKER} Subscribed to topic: "${TOPIC}"`,
  );

  await consumer.run({
    eachMessage: async ({ partition, message }) => {
      let event;

      try {
        event = JSON.parse(message.value.toString());
      } catch {
        console.error(
          "Analytics Consumer Invalid JSON in message:",
          message.value.toString(),
        );
        return;
      }

      try {
        await AnalyticsBooking.updateOne(
          { bookingId: event.bookingId || message.offset },
          {
            $setOnInsert: {
              bookingId: event.bookingId || message.offset,
              userId: event.userId,
              resourceId: event.resourceId,
              resourceName: event.resourceName || "Unknown",
              date: event.date,
              startTime: event.startTime,
              endTime: event.endTime,
            },
          },
          { upsert: true },
        );
        console.log(
          `Analytics Consumer: Stored booking — resource: "${event.resourceName || event.resourceId}", time: ${event.startTime}`,
        );
      } catch (err) {
        console.error(
          "Analytics Consumer: Failed to store event:",
          err.message,
        );
      }
    },
  });
}

async function stopConsumer() {
  await consumer.disconnect();
  console.log("Analytics Consumer: Disconnected from Kafka.");
}

module.exports = { startConsumer, stopConsumer };
