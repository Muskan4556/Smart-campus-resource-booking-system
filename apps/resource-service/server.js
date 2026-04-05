const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const resourceRoutes = require("./routes/resourceRoutes");

dotenv.config();
const app = express();
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Routes
app.use("/resources", resourceRoutes);

// Start server
const PORT = process.env.PORT || 5003;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));