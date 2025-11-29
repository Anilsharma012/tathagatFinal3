const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');
const { userAuth } = require('../middleware/authMiddleware');

router.get('/', userAuth, NotificationController.getMyNotifications);
router.get('/unread-count', userAuth, NotificationController.getUnreadCount);
router.put('/:id/read', userAuth, NotificationController.markAsRead);
router.put('/mark-all-read', userAuth, NotificationController.markAllAsRead);
router.delete('/:id', userAuth, NotificationController.deleteNotification);

module.exports = router;
