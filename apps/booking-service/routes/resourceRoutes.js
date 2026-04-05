const express = require("express");
const router = express.Router();
const Resource = require("../models/Resource");


// ✅ ADD RESOURCE (ADMIN)
router.post("/add", async (req, res) => {
  try {

    const { resourceId, resourceName, capacity, location } = req.body;

    // VALIDATION
    if (!resourceId || !resourceName || !capacity) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    if (capacity <= 0) {
      return res.status(400).json({ message: "Capacity must be greater than 0" });
    }

    // CHECK DUPLICATE
    const existing = await Resource.findOne({ resourceId });

    if (existing) {
      return res.status(400).json({ message: "Resource already exists" });
    }

    const resource = new Resource({
      resourceId,
      resourceName,
      capacity,
      location
    });

    await resource.save();

    res.json({
      message: "Resource added successfully",
      resource
    });

  } catch (error) {
    res.status(500).json({ message: "Error adding resource" });
  }
});


// ✅ GET ALL RESOURCES
router.get("/", async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: "Error fetching resources" });
  }
});


// ✅ DELETE RESOURCE
router.delete("/:id", async (req, res) => {
  try {

    const resource = await Resource.findByIdAndDelete(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.json({ message: "Resource deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: "Error deleting resource" });
  }
});

module.exports = router;