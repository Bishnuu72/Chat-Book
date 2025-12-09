// routes/UserRoutes.js
const express = require("express");
const router = express.Router();
const pool = require("../DB/db");
const multer = require("multer");
const path = require("path");

// configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// GET user profile
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, fullName, email, profileImg FROM users WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST upload profile photo
router.post("/:id/upload-photo", upload.single("profileImg"), async (req, res) => {
  try {
    const filePath = `/uploads/${req.file.filename}`;
    await pool.query("UPDATE users SET profileImg = ? WHERE id = ?", [
      filePath,
      req.params.id,
    ]);
    res.json({ profileImg: filePath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
