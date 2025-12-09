const express = require('express');
const router = express.Router();
const messageController = require('../controller/MessageController');
const authMiddleware = require('../middleware/FetchUser');

router.post('/send', authMiddleware, messageController.sendMessage);
router.get('/history/:friendId', authMiddleware, messageController.getChatHistory);

module.exports = router;
