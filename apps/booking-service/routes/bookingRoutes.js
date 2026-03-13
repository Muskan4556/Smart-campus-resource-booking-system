const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");

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