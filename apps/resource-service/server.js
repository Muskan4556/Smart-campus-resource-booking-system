const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const resourceRoutes = require("./routes/resourceRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ MongoDB connection using async/await
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "campus-resource"
    });
    console.log("MongoDB connected to campus-resource");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // exit if DB fails
  }
};

// Call DB connection
connectDB();

// Routes
app.use("/resources", resourceRoutes);

// Start server
const PORT = process.env.RESOURCE_PORT || 5003;
app.listen(PORT, () => console.log(`Resource service running on port ${PORT}`));