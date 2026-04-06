const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Prevent registering with the reserved admin email
    if (email === process.env.ADMIN_EMAIL) {
      return res.status(403).json("This email is reserved.");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });

    res.json({ message: "User registered", user });
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── 1. Check fixed admin credentials from .env ──────────────────────
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { id: "admin", role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      return res.json({
        message: "Login successful",
        token,
        role: "admin",
      });
    }

    // ── 2. Regular user login from database ──────────────────────────────
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json("User not found");
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json("Wrong password");
    }

    const token = jwt.sign(
      { id: user._id, role: user.role || "user" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role || "user",
    });

  } catch (error) {
    res.status(500).json(error.message);
  }
};