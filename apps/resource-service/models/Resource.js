const mongoose = require("mongoose");

// Define Resource Schema
const resourceSchema = new mongoose.Schema({
  resourceId: {
    type: String,
    required: true,
    unique: true
  },
  resourceName: {
    type: String,
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    min: 1
  },
  location: {
    type: String,
    default: "Campus"
  },
  status: {
    type: String,
    enum: ["available", "booked"],
    default: "available"
  },
  timeSlot: {
    type: String, // can be "10:00-11:00" format, or a Date depending on frontend
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to book the resource
resourceSchema.methods.bookResource = async function(slot) {
  if (this.status === "available") {
    this.status = "booked";
    this.timeSlot = slot;
    return await this.save();
  } else {
    throw new Error("Resource already booked");
  }
};

// Static method to get all resources (with status and timeslot)
resourceSchema.statics.displayResources = async function() {
  return await this.find({}, { _id: 0, __v: 0 }); // exclude _id and __v for frontend
};

// Export the Resource model
module.exports = mongoose.model("Resource", resourceSchema);