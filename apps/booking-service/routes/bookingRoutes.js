const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const axios = require("axios");

// SERVICES
const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://localhost:4000";
const RESOURCE_SERVICE_URL =
  process.env.RESOURCE_SERVICE_URL || "http://localhost:5002";

// KAFKA
const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "booking-service",
  brokers: ["localhost:9092"],
});

const producer = kafka.producer();

producer
  .connect()
  .then(() => console.log("Kafka Producer Connected"))
  .catch(() => console.log("Kafka not running, continuing..."));

// REDIS
const redis = require("redis");

const redisClient = redis.createClient({
  url: "redis://localhost:6379",
});

redisClient
  .connect()
  .then(() => console.log("Redis Connected"))
  .catch(() => console.log("Redis not running, continuing..."));

// HELPERS

function formatDate(dateStr) {
  if (!dateStr) return "N/A";

  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  return d.toLocaleDateString("en-GB").replace(/\//g, "-");
}

function timeToMinutes(t) {
  if (!t) return NaN;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function normalizeTime(t) {
  if (!t) return t;
  const [h, m] = t.split(":");
  return `${String(h).padStart(2, "0")}:${m}`;
}

function isOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

// CREATE BOOKING
router.post("/book", async (req, res) => {
  try {
    let { userId, resourceId, date, startTime, endTime } = req.body;

    // format date (handles ISO, string, etc.)
    date = formatDate(date);

    if (!userId || !resourceId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: "All fields are required" });
    }

    startTime = normalizeTime(startTime);
    endTime = normalizeTime(endTime);

    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    if (
      !Number.isFinite(newStart) ||
      !Number.isFinite(newEnd) ||
      newEnd <= newStart
    ) {
      return res.status(400).json({ message: "Invalid time range" });
    }

    const existingBookings = await Booking.find({ resourceId, date });

    for (const b of existingBookings) {
      const bs = timeToMinutes(b.startTime);
      const be = timeToMinutes(b.endTime);

      if (isOverlap(newStart, newEnd, bs, be)) {
        return res.status(400).json({ message: "Slot already booked" });
      }
    }

    const booking = new Booking({
      userId,
      resourceId,
      date,
      startTime,
      endTime,
    });

    await booking.save();

    try {
      await redisClient.del(`userBookings:${userId}`);
      await redisClient.del(`availability:${resourceId}:${date}`);
    } catch {}

    let user = {};
    let resource = {};

    try {
      const [userRes, resourceRes] = await Promise.allSettled([
        axios.get(`${AUTH_SERVICE_URL}/auth/users/${userId}`),
        axios.get(`${RESOURCE_SERVICE_URL}/resources/${resourceId}`),
      ]);

      if (userRes.status === "fulfilled") user = userRes.value.data;
      if (resourceRes.status === "fulfilled") resource = resourceRes.value.data;
    } catch {}

    const eventData = {
      bookingId: booking._id.toString(),
      userId,
      resourceId,
      resourceName: resource.resourceName || req.body.resourceName,
      date,
      startTime,
      endTime,
      userEmail: user.email || req.body.userEmail,
      userName: user.name || req.body.userName,
    };

    try {
      await producer.send({
        topic: "booking-created",
        messages: [{ value: JSON.stringify(eventData) }],
      });

      console.log("Kafka event sent");
    } catch {
      console.log("Kafka not running, skipping...");
    }

    res.json({
      message: "Booking successful",
      booking,
    });
  } catch (error) {
    console.log("Booking error:", error);
    res.status(500).json({ message: "Booking failed" });
  }
});

// GET ALL BOOKINGS
router.get("/", async (req, res) => {
  const bookings = await Booking.find();
  res.json(bookings);
});

// GET USER BOOKINGS
router.get("/user/:userId", async (req, res) => {
  try {
    const key = `userBookings:${req.params.userId}`;

    const cached = await redisClient.get(key);
    if (cached) return res.json(JSON.parse(cached));

    const bookings = await Booking.find({ userId: req.params.userId });

    await redisClient.set(key, JSON.stringify(bookings), { EX: 300 });

    res.json(bookings);
  } catch {
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

// GET RESOURCE BOOKINGS
router.get("/resource/:resourceId", async (req, res) => {
  try {
    const { resourceId } = req.params;
    const { date } = req.query;

    const formattedDate = date ? formatDate(date) : null;

    const query = { resourceId };
    if (formattedDate) query.date = formattedDate;

    const bookings = await Booking.find(query).select(
      "startTime endTime userId",
    );

    res.json(bookings);
  } catch {
    res.status(500).json({ message: "Error fetching resource bookings" });
  }
});

// DELETE BOOKING
router.delete("/:id", async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    await redisClient.del(`userBookings:${booking.userId}`);

    res.json({ message: "Booking deleted successfully" });
  } catch {
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;
