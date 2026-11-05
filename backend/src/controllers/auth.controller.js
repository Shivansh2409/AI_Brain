const jwt = require("jsonwebtoken");
const User = require("../models/user");

// Emails are compared case-insensitively by storing them lowercased.
const normalizeEmail = (email) => email.trim().toLowerCase();

// Only accept plain strings. This also blocks query-operator injection such as
// { "email": { "$ne": null } } reaching User.findOne().
const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const signToken = (user) =>
  jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

// Register Controller
const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    // Validation
    if (
      !isNonEmptyString(name) ||
      !isNonEmptyString(email) ||
      typeof password !== "string" ||
      typeof confirmPassword !== "string" ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const normalizedEmail = normalizeEmail(email);

    // Check if user already exists
    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create new user
    user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    res.status(201).json({
      token: signToken(user),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    // Two simultaneous sign-ups with the same email: the unique index catches it
    if (error.code === 11000) {
      return res.status(400).json({ error: "User already exists" });
    }
    console.error(error);
    res.status(500).json({ error: "Registration failed" });
  }
};

// Login Controller
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!isNonEmptyString(email) || typeof password !== "string" || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.status(200).json({
      token: signToken(user),
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed" });
  }
};

module.exports = { register, login };
