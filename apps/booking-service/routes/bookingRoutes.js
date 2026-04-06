const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const axios = require("axios");

const AUTH_SERVICE_URL     = process.env.AUTH_SERVICE_URL     || "http://localhost:4000";
const RESOURCE_SERVICE_URL = process.env.RESOURCE_SERVICE_URL || "http://localhost:5002";

// ------------------- KAFKA SETUP -------------------
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'booking-service',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

// connect only once
producer.connect()
  .then(() => console.log("Kafka Producer Connected"))
  .catch(err => console.log("Kafka not running, continuing without it..."));


// ------------------- REDIS SETUP -------------------
const redis = require("redis");

const redisClient = redis.createClient({
  url: "redis://localhost:6379"
});

redisClient.connect()
  .then(() => console.log("Redis Connected"))
  .catch(err => console.log("Redis not running, continuing without it..."));


// ------------------- CREATE BOOKING -------------------
router.post("/book", async (req,res)=>{

try{

const {userId, resourceId, date, startTime, endTime} = req.body;

// check overlap
const existing = await Booking.findOne({
  resourceId,
  date,
  $or:[
    {
      startTime:{$lt:endTime},
      endTime:{$gt:startTime}
    }
  ]
});

if(existing){
  return res.status(400).json({message:"Slot already booked"});
}

// create booking
const booking = new Booking({
  userId,
  resourceId,
  date,
  startTime,
  endTime
});

await booking.save();

// ------------------- REDIS CACHE CLEAR -------------------
try {
  await redisClient.del(`userBookings:${booking.userId}`);
  await redisClient.del(`availability:${booking.resourceId}:${booking.date}`);
} catch (_) {}


// ------------------- KAFKA EVENT -------------------
try {

  const [userRes, resourceRes] = await Promise.allSettled([
    axios.get(`${AUTH_SERVICE_URL}/auth/users/${booking.userId}`),
    axios.get(`${RESOURCE_SERVICE_URL}/resources/${booking.resourceId}`)
  ]);

  const user     = userRes.status     === "fulfilled" ? userRes.value.data     : {};
  const resource = resourceRes.status === "fulfilled" ? resourceRes.value.data : {};

  const eventData = {
    bookingId:    booking._id.toString(),
    userId:       booking.userId,
    resourceId:   booking.resourceId,
    resourceName: resource.resourceName || req.body.resourceName || "",
    date:         booking.date,
    startTime:    booking.startTime,
    endTime:      booking.endTime,
    userEmail:    user.email    || req.body.userEmail || "",
    userName:     user.name     || req.body.userName  || "",
  };

  await producer.send({
    topic: 'booking-created',
    messages: [{ value: JSON.stringify(eventData) }]
  });

  console.log("Kafka event sent");

} catch (err) {
  console.log("Kafka not running, skipping...");
}

res.json({
  message:"Booking successful",
  booking
});

}catch(error){
  console.log("Booking creation error:", error.message, error.stack);
  res.status(500).json({message:"Error creating booking", error: error.message});
}

});


// ------------------- GET ALL BOOKINGS -------------------
router.get("/", async (req,res)=>{
const bookings = await Booking.find();
res.json(bookings);
});


// ------------------- GET USER BOOKINGS (WITH REDIS CACHE) -------------------
router.get("/user/:userId", async (req,res)=>{

try{

const key = `userBookings:${req.params.userId}`;

// check cache
try {
  const cached = await redisClient.get(key);
  if (cached) {
    console.log("From Redis");
    return res.json(JSON.parse(cached));
  }
} catch (_) {}

// fetch from DB
const bookings = await Booking.find({userId:req.params.userId});

// store in Redis (5 mins)
try {
  await redisClient.set(key, JSON.stringify(bookings), { EX: 300 });
} catch (_) {}

res.json(bookings);

}catch(error){
  res.status(500).json({message:"Error fetching bookings"});
}

});

router.get("/resource/:resourceId", async (req, res) => {
    try {
      const { resourceId } = req.params;
      const { date } = req.query;
 
      const query = { resourceId };
      if (date) query.date = date;
 
     const bookings = await Booking.find(query).select("startTime endTime userId");
     res.json(bookings);
   } catch (error) {
     res.status(500).json({ message: "Error fetching resource bookings" });
   }
 });
// ------------------- DELETE BOOKING -------------------
router.delete("/:id", async (req,res)=>{

try{

const booking = await Booking.findByIdAndDelete(req.params.id);

if(!booking){
  return res.status(404).json({message:"Booking not found"});
}

// clear cache
try {
  await redisClient.del(`userBookings:${booking.userId}`);
} catch (_) {}

res.json({message:"Booking deleted successfully"});

}catch(error){
  res.status(500).json({message:"Error deleting booking"});
}

});

module.exports = router;