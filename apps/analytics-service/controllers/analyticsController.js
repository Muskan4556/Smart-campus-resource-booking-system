const AnalyticsBooking = require("../models/AnalyticsBooking");

exports.getPeakHours = async (req, res) => {
  try {
    const [peakHours, popularResources, totalBookings] = await Promise.all([

      AnalyticsBooking.aggregate([
        { $group: { _id: "$startTime", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $project: { _id: 0, timeSlot: "$_id", bookingCount: "$count" } },
      ]),

      AnalyticsBooking.aggregate([
        {
          $group: {
            _id:          "$resourceName",
            resourceId:   { $first: "$resourceId" },
            count:        { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $project: {
            _id:          0,
            resourceName: "$_id",
            resourceId:   1,
            bookingCount: "$count",
          },
        },
      ]),

      AnalyticsBooking.countDocuments(),
    ]);

    res.json({
      success: true,
      data: { totalBookings, peakHours, popularResources },
    });
  } catch (err) {
    console.error("[Analytics] Aggregation error:", err.message);
    res.status(500).json({ success: false, message: "Failed to compute analytics." });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const total = await AnalyticsBooking.countDocuments();
    res.json({
      success: true,
      message: "Analytics service is running.",
      totalEventsIngested: total,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
