const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  userId: String,
  resourceId: String,
  date: String,
  startTime: String,
  endTime: String
});

module.exports = mongoose.model("Booking", bookingSchema);