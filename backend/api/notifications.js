import express from 'express';
import { requireAuth } from '../utils/auth.js';
import { getNotificationsFor, addNotification, markAllReadFor, markNotificationAsRead } from '../utils/notifications.js';

const router = express.Router();

// Get notifications for a specific user (notification history)
router.get('/', requireAuth, async (req, res) => {
  try {
    const userNotifications = await getNotificationsFor(req.user);
    res.json({
      success: true,
      notifications: userNotifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch notifications',
      message: error.message 
    });
  }
});

// Create a new notification
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, message, role, userId, type } = req.body;
    
    if (!title || !message) {
      return res.status(400).json({ 
        success: false,
        error: 'Title and message are required' 
      });
    }
    
    const newNotification = await addNotification({ 
      title, 
      message, 
      role, 
      userId,
      type: type || 'info'
    });
    
    res.status(201).json({
      success: true,
      notification: newNotification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create notification',
      message: error.message 
    });
  }
});

// Mark notification as read
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const updatedNotification = await markNotificationAsRead(notificationId, req.user);
    
    res.json({
      success: true,
      notification: updatedNotification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    
    if (error.message === 'Notification not found') {
      return res.status(404).json({ 
        success: false,
        error: 'Notification not found' 
      });
    }
    
    if (error.message === 'Unauthorized to read this notification') {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized to read this notification' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to update notification',
      message: error.message 
    });
  }
});

// Mark all notifications as read for a user
router.post('/mark-all-read', requireAuth, async (req, res) => {
  try {
    await markAllReadFor(req.user);
    res.json({ 
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to mark notifications as read',
      message: error.message 
    });
  }
});

export default router;