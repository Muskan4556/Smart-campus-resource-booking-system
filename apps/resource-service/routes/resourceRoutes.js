const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const {
    addResource,
    getResources,
    getResourceById,
    updateResource,
    deleteResource
} = require("../controllers/resourceController");

require('dotenv').config();

// Admin middleware — verifies JWT and checks role
const isAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(403).json({ message: "Access denied: No token provided" });
    }

    try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.role !== "admin") {
            return res.status(403).json({ message: "Access denied: Admin only" });
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: "Access denied: Invalid or expired token" });
    }
};

// Routes
router.post("/add", isAdmin, addResource);
router.get("/", getResources);
router.get("/:id", getResourceById);
router.put("/:id", isAdmin, updateResource);
router.delete("/:id", isAdmin, deleteResource);

module.exports = router;