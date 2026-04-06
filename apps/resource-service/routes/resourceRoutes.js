const express = require("express");
const router = express.Router();
const {
    addResource,
    getResources,
    updateResource,
    deleteResource
} = require("../controllers/resourceController");

require('dotenv').config();

// Admin middleware
const isAdmin = (req, res, next) => {
    const username = req.headers.username;
    const password = req.headers.password;

    if (username !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
        return res.status(403).json({ message: "Access denied: Admin only" });
    }

    next();
};

// Routes
router.post("/add", isAdmin, addResource);
router.get("/", getResources);
router.put("/:id", isAdmin, updateResource);
router.delete("/:id", isAdmin, deleteResource);

module.exports = router;