require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const User = require("./models/User");

const app = express();   // ← app must be created FIRST

app.use(cors());
app.use(express.json());

mongoose.connect("mongodb://localhost:27017/campus")
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));

app.use("/auth", authRoutes);

// GET users route
app.get("/auth/users", async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
});

app.listen(4000, () => {
  console.log("Auth service running on port 4000");
});