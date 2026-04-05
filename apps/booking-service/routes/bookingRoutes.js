const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");

const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'booking-service',
  brokers: ['localhost:9092'] // same as .env
});

const producer = kafka.producer();

router.post("/book", async (req,res)=>{

const {userId, resourceId, date, startTime, endTime} = req.body;

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

const booking = new Booking({
userId,
resourceId,
date,
startTime,
endTime
});

await booking.save();

try {
  await producer.connect();

  // ✅ create event data FIRST
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
  // ✅ send event ONCE
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

});

//NEW GET API
router.get("/", async (req,res)=>{
const bookings = await Booking.find();
res.json(bookings);
});

router.get("/user/:userId", async (req,res)=>{
const bookings = await Booking.find({userId:req.params.userId});
res.json(bookings);
});

router.delete("/:id", async (req,res)=>{

try{

const booking = await Booking.findByIdAndDelete(req.params.id);

if(!booking){
return res.status(404).json({message:"Booking not found"});
}

res.json({message:"Booking deleted successfully"});

}catch(error){
res.status(500).json({message:"Error deleting booking"});
}

});

module.exports = router;