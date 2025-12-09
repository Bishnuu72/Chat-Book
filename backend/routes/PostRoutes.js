// routes/PostRoutes.js
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/FetchUser");
const postController = require("../controller/PostController");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure directory
const postsDir = path.join(__dirname, "../uploads/posts");
if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, postsDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const upload = multer({ storage });

// ██████████████████ THIS IS THE ONLY CORRECT ORDER ██████████████████
router.post(
  "/create",
  authMiddleware,                                        // ← 1. AUTH FIRST (CRITICAL)
  (req, res, next) => {
    // If client sent a file → use normal multer
    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      return upload.single("media")(req, res, next);
    }
    // If no file (text-only) → use upload.none() to parse form fields
    return upload.none()(req, res, next);
  },
  postController.createPost                                           // ← 3. THEN CONTROLLER
);

// Other routes (order doesn't matter as much here)
router.get("/feed", authMiddleware, postController.getFeed);
router.get("/user/:userId", authMiddleware, postController.getUserPosts);
router.delete("/:postId", authMiddleware, postController.deletePost);

module.exports = router;