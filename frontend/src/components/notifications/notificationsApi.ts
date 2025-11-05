import { apiClient } from '../../lib/api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  role?: string;
  userId?: string;
  type?: string;
  createdAt: string;
  read: boolean;
  readAt?: string;
}

export const notificationsApi = {
  getNotifications: async (): Promise<Notification[]> => {
    return await apiClient.getNotifications();
  },

  createNotification: async (data: {
    title: string;
    message: string;
    role?: string;
    userId?: string;
  }): Promise<Notification> => {
    return await apiClient.createNotification(data);
  },

  markAsRead: async (id: string): Promise<Notification> => {
    return await apiClient.markNotificationAsRead(id);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.markAllNotificationsAsRead();
  },
};