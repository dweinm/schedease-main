// Database-based notifications store
import { Notification } from '../config/database.js';

export async function addNotification({ title, message, role, userId, type = 'info' }) {
  try {
    const notification = new Notification({
      title,
      message,
      role: role || undefined,
      userId: userId || undefined,
      type,
      read: false
    });
    
    const savedNotification = await notification.save();
    
    // Return in the format expected by existing code
    return {
      id: savedNotification._id.toString(),
      title: savedNotification.title,
      message: savedNotification.message,
      role: savedNotification.role,
      userId: savedNotification.userId ? savedNotification.userId.toString() : undefined,
      type: savedNotification.type,
      createdAt: savedNotification.createdAt.toISOString(),
      read: savedNotification.read
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

export async function getNotificationsFor(user) {
  try {
    const userId = user?.id || user?._id?.toString();
    const role = user?.role;
    
    // Find notifications that match:
    // 1. User-specific notifications (userId matches)
    // 2. Role-based notifications (role matches and no userId)
    const query = {
      $or: [
        { userId: userId },
        { role: role, userId: { $exists: false } },
        { role: role, userId: null }
      ]
    };
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(100) // Limit to most recent 100 notifications
      .lean();
    
    // Convert to format expected by frontend
    return notifications.map(notif => ({
      id: notif._id.toString(),
      title: notif.title,
      message: notif.message,
      role: notif.role,
      userId: notif.userId ? notif.userId.toString() : undefined,
      type: notif.type,
      createdAt: notif.createdAt.toISOString(),
      read: notif.read,
      readAt: notif.readAt ? notif.readAt.toISOString() : undefined
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

export async function markNotificationAsRead(notificationId, user) {
  try {
    // Verify the notification belongs to the user or their role
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    const userId = user?.id || user?._id?.toString();
    const userRole = user?.role;
    
    // Check if user has permission to read this notification
    const canRead = notification.userId?.toString() === userId ||
                     (!notification.userId && notification.role === userRole);
    
    if (!canRead) {
      throw new Error('Unauthorized to read this notification');
    }
    
    notification.read = true;
    notification.readAt = new Date();
    await notification.save();
    
    return {
      id: notification._id.toString(),
      title: notification.title,
      message: notification.message,
      role: notification.role,
      userId: notification.userId ? notification.userId.toString() : undefined,
      type: notification.type,
      createdAt: notification.createdAt.toISOString(),
      read: notification.read,
      readAt: notification.readAt.toISOString()
    };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

export async function markAllReadFor(user) {
  try {
    const userId = user?.id || user?._id?.toString();
    const role = user?.role;
    
    const query = {
      $or: [
        { userId: userId },
        { role: role, userId: { $exists: false } },
        { role: role, userId: null }
      ],
      read: false
    };
    
    await Notification.updateMany(
      query,
      {
        $set: {
          read: true,
          readAt: new Date()
        }
      }
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

