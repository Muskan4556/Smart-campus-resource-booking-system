const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema({
  resourceId: {
    type: String,
    unique: true,
    default: () => "RES-" + Date.now().toString(36).toUpperCase(),
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String, // Lab, Room, Auditorium
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  location: {
    type: String
  },
  availabilityHours: {
    start: {
      type: String, // e.g. "09:00"
      required: true
    },
    end: {
      type: String, // e.g. "17:00"
      required: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Resource", resourceSchema);