const Resource = require("../models/Resource");

// Add a new resource
exports.addResource = async (req, res) => {
    try {
        const { resourceId, resourceName, capacity, location } = req.body;

        if (!resourceId || !resourceName || !capacity) {
            return res.status(400).json({ message: "All required fields must be filled" });
        }

        if (capacity <= 0) {
            return res.status(400).json({ message: "Capacity must be greater than 0" });
        }

        // Check for duplicates
        const existing = await Resource.findOne({ resourceId });
        if (existing) {
            return res.status(400).json({ message: "Resource already exists" });
        }

        const resource = new Resource({ resourceId, resourceName, capacity, location });
        await resource.save();

        res.status(201).json({ message: "Resource added successfully", resource });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all resources (public)
exports.getResources = async (req, res) => {
    try {
        const resources = await Resource.find();
        res.json(resources);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update resource (admin only)
exports.updateResource = async (req, res) => {
    try {
        const { resourceName, capacity, location } = req.body;

        if (capacity && capacity <= 0) {
            return res.status(400).json({ message: "Capacity must be greater than 0" });
        }

        const updated = await Resource.findByIdAndUpdate(
            req.params.id,
            { resourceName, capacity, location },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Resource not found" });
        }

        res.json({ message: "Resource updated successfully", updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete resource (admin only)
exports.deleteResource = async (req, res) => {
    try {
        const resource = await Resource.findByIdAndDelete(req.params.id);
        if (!resource) {
            return res.status(404).json({ message: "Resource not found" });
        }

        res.json({ message: "Resource deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};