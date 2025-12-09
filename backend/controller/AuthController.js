const express = require("express");
const { createUser, loginUserById, deleteUserById, fetchUserById, getUserById, updateUserById, fetchAllUsers } = require("../model/UserSql");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;


exports.registerUser = async(req, res) => {
    const {fullName, email, password} = req.body;
    if(!fullName || !email || !password) {
        return res.status(400).json({message: "All fields are required"});
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        // Store user in the database
        const result = await createUser(fullName, email, hashedPassword);
        console.log("User registered:", email);
        return res.status(201).json({message: "User registered successfully", userId: result.insertId});
    } catch (error) {
        //show error if email already exists
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({message: "Email already exists"});
        }
        console.error("Error registering user:", error);
        return res.status(500).json({message: "Internal Server Error"});
    }

}

exports.loginUser = async(req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    try {
        // Check if user exists
        const user = await loginUserById(email);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        // Generate JWT token
        const token = jwt.sign(
        { user: { id: user.id, email: user.email }},
        JWT_SECRET,
        { expiresIn: "1h" }
        );

        console.log("User logged in:", email);
        return res.status(200).json({
        message: "Login successful",
        token,
        userId: user.id
        });
    } catch (error) {
        console.error("Error logging in user:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

//update user details
exports.updateUser = async(req, res) => {
    const { id } = req.params;
    const { fullName, email, password } = req.body;
    if (!fullName && !email && !password) {
        return res.status(400).json({ message: "At least one field is required to update" });
    }
    try {
        const user = await getUserById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const updatedFields = {};
        if (fullName) updatedFields.fullName = fullName;
        if (email) updatedFields.email = email;
        if (password) updatedFields.password = await bcrypt.hash(password, 10);
        updatedFields.updatedAt = new Date();
        await updateUserById(id, updatedFields);
        return res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

//delete user
exports.deleteUser = async(req, res) => {
    const { id } = req.params;
    try {
        const user = await getUserById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        await deleteUserById(id);
        return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

//fetch user details
exports.getUserDetails = async(req, res) => {
    const { id } = req.params;
    try {
        const user = await fetchUserById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ user });
    } catch (error) {
        console.error("Error fetching user details:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

//fetch all users - for future use
exports.fetchAllUsers = async(req, res) => {
    try {
        const users = await fetchAllUsers();
        return res.status(200).json({ users });
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

// NEW: Search users by name (protected route)
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user.id; // From auth middleware

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: 'Query too short (minimum 2 characters)' });
    }

    console.log(`Searching for "${query}" by user ID ${currentUserId}`);

    // Call model function
    const users = await searchUsersByName(query.trim(), currentUserId);

    console.log(`Found ${users.length} users for query "${query}"`);
    return res.status(200).json(users); // Returns array directly: [{ id, fullName, profileImg }, ...]
  } catch (error) {
    console.error("Error searching users:", error);
    return res.status(500).json({ message: "Internal Server Error during search" });
  }
}