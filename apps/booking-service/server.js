const express = require("express");
const mongoose = require("mongoose");

// ✅ LOAD ENV FILE (VERY IMPORTANT)
require('dotenv').config({ path: '../../.env' });

const bookingRoutes = require("./routes/bookingRoutes");

const app = express();

// middleware
app.use(express.json());

// ✅ CONNECT TO MONGODB USING .env
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Error:", err));

// test route
app.get("/", (req, res) => {
  res.send("Booking Service Running");
});

// ✅ IMPORTANT CHANGE HERE
app.use("/booking", bookingRoutes);

const PORT = 5003;

app.listen(PORT, () => {
  console.log(`Booking Service running on port ${PORT}`);
});