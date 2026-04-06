require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});

console.log("Path resolves to:", require("path").resolve(__dirname, "../../.env"));
console.log("ENV CHECK:", {
  JWT_SECRET: process.env.JWT_SECRET ? "✓ loaded" : "✗ MISSING",
  ADMIN_EMAIL: process.env.ADMIN_EMAIL ? "✓ loaded" : "✗ MISSING",
  MONGO_URI:   process.env.MONGO_URI   ? "✓ loaded" : "✗ MISSING",
});

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const User = require("./models/User");

const app = express();

app.use(cors());
app.use(express.json());

// ✅ UPDATED DB CONNECTION
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "campus-auth"
    });
    console.log("MongoDB connected");
  } catch (err) {
    console.log(err);
  }
};

connectDB();

app.use("/auth", authRoutes);

app.get("/auth/users", async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

app.get("/auth/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(4000, () => {
  console.log("Auth service running on port 4000");
});