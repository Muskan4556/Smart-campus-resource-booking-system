const express = require("express");
const router  = express.Router();
const { getPeakHours, getSummary } = require("../controllers/analyticsController");

router.get("/peak-hours", getPeakHours);
router.get("/summary",    getSummary);

module.exports = router;
