const express = require('express');
const router = express.Router();
const friendController = require('../controller/FriendController');
const authMiddleware = require('../middleware/FetchUser');

router.get('/search', authMiddleware, friendController.searchUsers);
router.post('/add', authMiddleware, friendController.sendRequest);
router.put('/accept/:requestId', authMiddleware, friendController.acceptRequest);
router.get('/list', authMiddleware, friendController.getFriends);
router.get('/pending', authMiddleware, friendController.getPendingRequests);


module.exports = router;
