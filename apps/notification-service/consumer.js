const { Kafka, logLevel } = require("kafkajs");
const { sendBookingConfirmation } = require("./mailer");

const KAFKA_BROKER = process.env.KAFKA_BROKER || "localhost:9092";
const TOPIC = "booking-created";
const GROUP_ID = "notification-service-group";

const kafka = new Kafka({
  clientId: "notification-service",
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
 * Connects to Kafka and starts listening for BookingCreated events.
 * Returns the consumer instance so the caller can disconnect it on shutdown.
 */
async function startConsumer() {
  await consumer.connect();
  console.log(`Consumer: Connected to Kafka broker at ${KAFKA_BROKER}`);

  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });
  console.log(`Consumer: Subscribed to topic: "${TOPIC}"`);

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      let event;

      try {
        event = JSON.parse(message.value.toString());
      } catch {
        console.error(
          "Consumer: Failed to parse message — not valid JSON:",
          message.value.toString(),
        );
        return;
      }

      console.log(
        `Consumer: Received event on "${topic}" [partition ${partition}]`,
      );

      try {
        await sendBookingConfirmation(event);
      } catch (err) {
        console.error("Consumer: Failed to send notification:", err.message);
      }
    },
  });
}

async function stopConsumer() {
  await consumer.disconnect();
  console.log("Consumer: Disconnected from Kafka.");
}

module.exports = { startConsumer, stopConsumer };
