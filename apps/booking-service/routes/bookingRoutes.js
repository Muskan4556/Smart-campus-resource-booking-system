const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");

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
await redisClient.del(`userBookings:${booking.userId}`);
await redisClient.del(`availability:${booking.resourceId}:${booking.date}`);


// ------------------- KAFKA EVENT -------------------
try {

  const eventData = {
    bookingId: booking._id.toString(),
    userId: booking.userId,
    resourceId: booking.resourceId,
    resourceName: req.body.resourceName || "Unknown",
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    userEmail: req.body.userEmail || "test@gmail.com",
    userName: req.body.userName || "Test User"
  };

  await producer.send({
    topic: 'booking-created',
    messages: [
      { value: JSON.stringify(eventData) }
    ]
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
  res.status(500).json({message:"Error creating booking"});
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
const cached = await redisClient.get(key);

if(cached){
  console.log("From Redis");
  return res.json(JSON.parse(cached));
}

// fetch from DB
const bookings = await Booking.find({userId:req.params.userId});

// store in Redis (5 mins)
await redisClient.set(key, JSON.stringify(bookings), {
  EX: 300
});

res.json(bookings);

}catch(error){
  res.status(500).json({message:"Error fetching bookings"});
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
await redisClient.del(`userBookings:${booking.userId}`);

res.json({message:"Booking deleted successfully"});

}catch(error){
  res.status(500).json({message:"Error deleting booking"});
}

});

module.exports = router;