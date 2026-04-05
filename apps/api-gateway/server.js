const express = require("express");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

const app = express();

app.use(cors());
app.use(express.json());

// AUTH SERVICE
app.use("/auth", createProxyMiddleware({
  target: "http://localhost:4000",
  changeOrigin: true
}));

// RESOURCE SERVICE
app.use("/resources", createProxyMiddleware({
  target: "http://localhost:5000",
  changeOrigin: true
}));

// BOOKING SERVICE
app.use("/bookings", createProxyMiddleware({
  target: "http://localhost:6000",
  changeOrigin: true
}));

app.listen(3000, () => {
  console.log("API Gateway running on port 3000");
});