const pool = require('../DB/db');
const mysql = require('mysql2/promise');

// Send Friend Request
exports.sendFriendRequest = async (requesterId, receiverId) => {
  const checkQuery = `
    SELECT * FROM friends 
    WHERE (requesterId = ? AND receiverId = ?) 
       OR (requesterId = ? AND receiverId = ?)
  `;
  const [existing] = await pool.execute(checkQuery, [requesterId, receiverId, receiverId, requesterId]);

  if (existing.length > 0) {
    return { success: false, message: "Friend request already exists or users are already friends." };
  }

  const insertQuery = `
    INSERT INTO friends (requesterId, receiverId, status, createdAt, updatedAt)
    VALUES (?, ?, 'pending', ?, ?)
  `;
  const [result] = await pool.execute(insertQuery, [requesterId, receiverId, new Date(), new Date()]);
  return { success: true, message: "Friend request sent.", result };
};

// Accept Friend Request
exports.acceptFriendRequest = async (requesterId, receiverId) => {
  const query = `
    UPDATE friends 
    SET status = 'accepted', updatedAt = ? 
    WHERE requesterId = ? AND receiverId = ? AND status = 'pending'
  `;
  const [result] = await pool.execute(query, [new Date(), requesterId, receiverId]);
  return result.affectedRows > 0
    ? { success: true, message: "Friend request accepted." }
    : { success: false, message: "No pending request found." };
};

// Reject Friend Request
exports.rejectFriendRequest = async (requesterId, receiverId) => {
  const query = `
    UPDATE friends 
    SET status = 'rejected', updatedAt = ? 
    WHERE requesterId = ? AND receiverId = ? AND status = 'pending'
  `;
  const [result] = await pool.execute(query, [new Date(), requesterId, receiverId]);
  return result.affectedRows > 0
    ? { success: true, message: "Friend request rejected." }
    : { success: false, message: "No pending request found." };
};

// Get All Friends of a User (include profileImg)
exports.getFriendsList = async (userId) => {
  const query = `
    SELECT 
      u.id, u.fullName, u.email, u.profileImg
    FROM users u
    JOIN friends f
      ON (
        (f.requesterId = u.id AND f.receiverId = ?) 
        OR (f.receiverId = u.id AND f.requesterId = ?)
      )
    WHERE f.status = 'accepted'
  `;
  const [rows] = await pool.execute(query, [userId, userId]);
  return rows;
};

// Get Pending Friend Requests (include profileImg)
exports.getPendingRequests = async (userId) => {
  const query = `
    SELECT 
      f.id, f.requesterId, u.fullName AS requesterName, u.email AS requesterEmail, u.profileImg AS requesterImg
    FROM friends f
    JOIN users u ON f.requesterId = u.id
    WHERE f.receiverId = ? AND f.status = 'pending'
  `;
  const [rows] = await pool.execute(query, [userId]);
  return rows;
};

// Search Registered Users (include profileImg)
exports.searchUsers = async (queryText, userId) => {
  const query = `
    SELECT id, fullName, email, profileImg 
    FROM users 
    WHERE fullName LIKE ? AND id != ?
  `;
  const [rows] = await pool.execute(query, [`%${queryText}%`, userId]);
  return rows;
};

// Check if Two Users Are Already Friends
exports.checkFriendshipStatus = async (user1, user2) => {
  const query = `
    SELECT status FROM friends 
    WHERE (requesterId = ? AND receiverId = ?) 
       OR (requesterId = ? AND receiverId = ?)
  `;
  const [rows] = await pool.execute(query, [user1, user2, user2, user1]);
  return rows[0] || null;
};
