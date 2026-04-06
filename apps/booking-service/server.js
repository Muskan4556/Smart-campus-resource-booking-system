// apps/booking-service/server.js

// ✅ LOAD ENV FILE (VERY IMPORTANT)
require("dotenv").config({ path: "../../.env" });

const express = require("express");
const mongoose = require("mongoose");

const bookingRoutes = require("./routes/bookingRoutes");

const app = express();

// ✅ MIDDLEWARE
app.use(express.json());

// ✅ CONNECT TO MONGODB
mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "campus-booking", 
  })
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.error("MongoDB Error ❌:", err));

// ✅ TEST ROUTE
app.get("/", (req, res) => {
  res.send("Booking Service Running ✅");
});

// ✅ ROUTES
app.use("/booking", bookingRoutes);

// ✅ START SERVER
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`Booking Service running on port ${PORT} 🚀`);
});