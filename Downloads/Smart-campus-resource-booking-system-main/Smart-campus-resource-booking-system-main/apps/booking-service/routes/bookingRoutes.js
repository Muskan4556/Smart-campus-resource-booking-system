const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");

router.post("/book", async (req,res)=>{

const {userId, resourceId, date, startTime, endTime} = req.body;

const existing = await Booking.findOne({
resourceId,
date,
startTime
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

module.exports = router;