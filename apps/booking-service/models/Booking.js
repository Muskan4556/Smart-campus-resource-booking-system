const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  resourceId: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  }
}, {
  timestamps: true   // adds createdAt and updatedAt automatically
});

module.exports = mongoose.model("Booking", bookingSchema);