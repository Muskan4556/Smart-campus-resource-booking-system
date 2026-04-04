const express = require("express");
const mongoose = require("mongoose");

require('dotenv').config({ path: '../../.env' });g

const bookingRoutes = require("./routes/bookingRoutes");

const app = express();

// Middleware
app.use(express.json());

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/booking-service")
.then(() => {
    console.log("MongoDB Connected");
})
.catch((err) => {
    console.log("MongoDB Connection Error:", err);
});

// Test route
app.get("/", (req, res) => {
    res.send("Booking Service Running");
});

// Booking routes
app.use("/booking", bookingRoutes);

// Start server
const PORT = 5003;

app.listen(PORT, () => {
    console.log(`Booking Service running on port ${PORT}`);
});