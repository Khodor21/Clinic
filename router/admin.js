const express = require("express");
const router = express.Router();
const session = require("express-session");
const Admin = require("../models/Admin");
const verifyAdminAuth = (req, res, next) => {
  if (req.session.isAdmin) {
    // The user is authenticated as an admin
    next();
  } else {
    return res.status(403).json({ message: "Access forbidden" });
  }
};

router.get("/admin/dashboard", verifyAdminAuth, (req, res) => {
  return res.status(200).json({ message: "Welcome to the admin dashboard" });
});

router.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.FIXED_ADMIN_USERNAME &&
    password === process.env.FIXED_ADMIN_PASSWORD
  ) {
    req.session.isAdmin = true;

    return res.status(200).json({ message: "Admin login successful" });
  } else {
    return res.status(401).json({ message: "Invalid credentials" });
  }
});

module.exports = router;
