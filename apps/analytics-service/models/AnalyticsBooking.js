const mongoose = require("mongoose");

const analyticsBookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  resourceId: { type: String, required: true },
  resourceName: { type: String, default: "Unknown" },
  date: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  receivedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("AnalyticsBooking", analyticsBookingSchema);
