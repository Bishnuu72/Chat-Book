const MsgSql = require('../model/msgSql');

// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !content) {
      return res.status(400).json({ message: "Receiver and content required" });
    }

    const result = await MsgSql.createMessage(senderId, receiverId, content);
    res.status(201).json({ success: true, message: "Message sent", messageId: result.insertId });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get chat history
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const friendId = req.params.friendId;

    const messages = await MsgSql.getMessagesBetweenUsers(userId, friendId);
    res.status(200).json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
