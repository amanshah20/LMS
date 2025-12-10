const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get notifications for current user
router.get('/my-notifications', authMiddleware, async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    const notifications = await Notification.findAll({
      where: {
        recipientRole: [userRole, 'all']
      },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    // Filter notifications for specific user or all
    const userNotifications = notifications.filter(n => 
      n.recipientId === null || n.recipientId === userId || n.recipientRole === 'all'
    );

    res.json({
      success: true,
      notifications: userNotifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

// Create notification (Admin only)
router.post('/create', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { recipientRole, recipientId, title, message, type, priority } = req.body;

    if (!title || !message || !recipientRole) {
      return res.status(400).json({ message: 'Title, message, and recipient role are required' });
    }

    const notification = await Notification.create({
      recipientRole,
      recipientId: recipientId || null,
      title,
      message,
      type: type || 'general',
      priority: priority || 'medium'
    });

    res.status(201).json({
      success: true,
      message: 'Notification sent successfully',
      notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Error creating notification', error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ message: 'Error updating notification', error: error.message });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authMiddleware, async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    await Notification.update(
      { isRead: true },
      {
        where: {
          recipientRole: [userRole, 'all'],
          isRead: false
        }
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ message: 'Error updating notifications', error: error.message });
  }
});

// Delete notification (Admin only)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.destroy();

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification', error: error.message });
  }
});

module.exports = router;
