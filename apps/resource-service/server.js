const express = require("express");
const mongoose = require("mongoose");
const resourceRoutes = require("./routes/resourceRoutes");
require('dotenv').config();

const app = express();
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

// Routes
app.use("/resources", resourceRoutes);

// Start server
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`Resource service running on port ${PORT}`));