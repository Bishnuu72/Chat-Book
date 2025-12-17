// SQL queries for message-related operations
const pool = require('../DB/db');
const mysql = require('mysql2/promise');

// Create a new message
exports.createMessage = async (senderId, receiverId, content) => {
    const query = mysql.format(
        'INSERT INTO messages (senderId, receiverId, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
        [senderId, receiverId, content, new Date(), new Date()]
    );
    const [result] = await pool.execute(query);
    return result;
};

// Get messages between two users
exports.getMessagesBetweenUsers = async (userId1, userId2) => {
    const query = mysql.format(
        `SELECT * FROM messages WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?) ORDER BY createdAt ASC`,
        [userId1, userId2, userId2, userId1]
    );
    const [rows] = await pool.execute(query);
    return rows;
};



