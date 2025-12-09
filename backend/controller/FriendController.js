const FriendSql = require('../model/FriendSql');

// Send friend request
exports.sendRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const requesterId = req.user.id;

    if (receiverId === requesterId)
      return res.status(400).json({ message: "You can't add yourself." });

    const status = await FriendSql.checkFriendshipStatus(requesterId, receiverId);
    if (status) return res.status(400).json({ message: 'Already sent or friends.' });

    const result = await FriendSql.sendFriendRequest(requesterId, receiverId);
    res.json({ message: result.message || 'Request sent successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Accept friend request
exports.acceptRequest = async (req, res) => {
  try {
    const requesterId = req.params.requestId;
    const receiverId = req.user.id;

    const result = await FriendSql.acceptFriendRequest(requesterId, receiverId);
    res.json({ message: result.message || 'Friend request accepted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all friends
exports.getFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    const friends = await FriendSql.getFriendsList(userId);
    res.json(Array.isArray(friends) ? friends : []);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Search users
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;
    const users = await FriendSql.searchUsers(query, userId);
    res.json(Array.isArray(users) ? users : []);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get pending friend requests
exports.getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await FriendSql.getPendingRequests(userId);
    res.json(Array.isArray(requests) ? requests : []);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
