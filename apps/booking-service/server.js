const express = require("express");
const mongoose = require("mongoose");

require('dotenv').config({ path: '../../.env' });

const bookingRoutes = require("./routes/bookingRoutes");
const resourceRoutes = require("./routes/resourceRoutes"); // ✅ ADDED

const app = express();

// ✅ Middleware
app.use(express.json());

// ✅ MongoDB connection
mongoose.connect("mongodb://localhost:27017/booking-service")
.then(() => {
    console.log("MongoDB Connected");
})
.catch((err) => {
    console.log("MongoDB Connection Error:", err);
});

// ✅ Test route
app.get("/", (req, res) => {
    res.send("Booking Service Running");
});

// ✅ Booking routes (existing)
app.use("/booking", bookingRoutes);

// ✅ Resource routes (NEW - ADMIN)
app.use("/api/resources", resourceRoutes);

// ✅ Start server
const PORT = 5003;

app.listen(PORT, () => {
    console.log(`Booking Service running on port ${PORT}`);
});