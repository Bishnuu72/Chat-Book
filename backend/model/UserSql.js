const pool = require('../DB/db');
const mysql = require('mysql2/promise');

exports.createUser = async (fullName, email, password) => {
    const query = mysql.format(
        'INSERT INTO Users (fullName, email, password, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
        [fullName, email, password, new Date(), new Date()]
    );
    const [result] = await pool.execute(query);
    return result;
}

// Login user
exports.loginUserById = async (email) => {
    const query = mysql.format(
        'SELECT * FROM Users WHERE email = ?',
        [email]
    );
    const [rows] = await pool.execute(query);
    return rows[0];
}

// Update user details
exports.getUserById = async (id) => {
    const query = mysql.format(
        'SELECT * FROM Users WHERE id = ?',
        [id]
    );
    const [rows] = await pool.execute(query);
    return rows[0];
}
exports.updateUserById = async (id, updatedFields) => {
    const setClause = Object.keys(updatedFields).map(field => `${field} = ?`).join(', ');
    const values = Object.values(updatedFields);
    values.push(id); // for the WHERE clause
    const query = mysql.format(
        `UPDATE Users SET ${setClause} WHERE id = ?`,
        values
    );
    const [result] = await pool.execute(query);
    return result;
}

// Delete user
exports.deleteUserById = async (id) => {
    const query = mysql.format(
        'DELETE FROM Users WHERE id = ?',
        [id]
    );
    const [result] = await pool.execute(query);
    return result;
}

//fetch user details
exports.fetchUserById = async (id) => {
    const query = mysql.format(
        'SELECT * FROM Users WHERE id = ?',
        [id]
    );
    const [rows] = await pool.execute(query);
    return rows[0];
}

//Fetch all users - for future use
exports.fetchAllUsers = async () => {
    const query = 'SELECT id, fullName, email, createdAt, updatedAt FROM Users';
    const [rows] = await pool.execute(query);
    return rows;
}