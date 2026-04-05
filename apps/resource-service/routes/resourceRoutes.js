const express = require("express");
const router = express.Router();
const Resource = require("../models/Resource");

// ADMIN CHECK
const isAdmin = (req, res, next) => {
  const role = req.headers.role;
  if (role !== "admin") return res.status(403).json({ message: "Access denied: Admin only" });
  next();
};

// ADD RESOURCE
router.post("/add", isAdmin, async (req, res) => {
  try {
    const { resourceId, resourceName, capacity, location } = req.body;

    if (!resourceId || !resourceName || !capacity)
      return res.status(400).json({ message: "All required fields must be filled" });

    if (capacity <= 0) return res.status(400).json({ message: "Capacity must be greater than 0" });

    const existing = await Resource.findOne({ resourceId });
    if (existing) return res.status(400).json({ message: "Resource already exists" });

    const resource = new Resource({ resourceId, resourceName, capacity, location });
    await resource.save();

    res.json({ message: "Resource added successfully", resource });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding resource" });
  }
});

// GET ALL RESOURCES
router.get("/", async (req, res) => {
  try {
    const resources = await Resource.find();
    res.json(resources);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching resources" });
  }
});

// UPDATE RESOURCE
router.put("/:id", isAdmin, async (req, res) => {
  try {
    const { resourceName, capacity, location } = req.body;
    if (capacity && capacity <= 0) return res.status(400).json({ message: "Capacity must be >0" });

    const updated = await Resource.findByIdAndUpdate(req.params.id, { resourceName, capacity, location }, { new: true });
    if (!updated) return res.status(404).json({ message: "Resource not found" });

    res.json({ message: "Resource updated successfully", updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating resource" });
  }
});

// DELETE RESOURCE
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });
    res.json({ message: "Resource deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting resource" });
  }
});

module.exports = router;