import express from 'express';
import { requireAuth } from '../utils/auth.js';

const router = express.Router();

// In-memory storage for notifications (replace with database in production)
let notifications = [];

// Get notifications for a specific user
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const userNotifications = notifications.filter(n => 
      n.userId === userId || 
      (n.role === userRole && !n.userId) // Role-specific notifications
    );
    
    res.json(userNotifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Create a new notification
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, message, role, userId } = req.body;
    
    const newNotification = {
      id: Date.now().toString(),
      title,
      message,
      role,
      userId,
      createdAt: new Date().toISOString(),
      read: false
    };
    
    notifications.push(newNotification);
    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// Mark notification as read
router.patch('/:id/read', requireAuth, async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = notifications.find(n => n.id === notificationId);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    notification.read = true;
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all notifications as read for a user
router.post('/mark-all-read', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    notifications = notifications.map(n => {
      if (n.userId === userId || (n.role === userRole && !n.userId)) {
        return { ...n, read: true };
      }
      return n;
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

export default router;