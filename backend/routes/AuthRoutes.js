const express = require("express");
const { registerUser, loginUser, updateUser, deleteUser, getUserDetails, fetchAllUsers, searchUsers } = require("../controller/AuthController");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/update/:id", updateUser);
router.delete("/delete/:id", deleteUser);
router.get("/user/:id", getUserDetails);
router.get("/users", fetchAllUsers);
router.get("/search", searchUsers);

module.exports = router;