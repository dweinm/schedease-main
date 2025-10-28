import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { 
  Bell, 
  Check, 
  X, 
  Settings, 
  AlertTriangle, 
  Info, 
  Calendar,
  Users,
  BookOpen,
  MapPin,
  Clock,
  Filter,
  Search,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '../AuthContext';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'schedule' | 'announcement';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'system' | 'schedule' | 'course' | 'room' | 'user' | 'announcement';
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
  actionUrl?: string;
  sender?: {
    name: string;
    role: string;
  };
  metadata?: {
    courseId?: string;
    roomId?: string;
    scheduleId?: string;
  };
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  scheduleChanges: boolean;
  announcements: boolean;
  systemAlerts: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    scheduleChanges: true,
    announcements: true,
    systemAlerts: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '07:00'
    }
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Mock notifications based on user role
      const mockNotifications: Notification[] = [
        {
          _id: '1',
          title: 'Schedule Conflict Resolved',
          message: 'The scheduling conflict for CS101 has been automatically resolved by moving the class to Room B-205.',
          type: 'success',
          priority: 'medium',
          category: 'schedule',
          isRead: false,
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
          sender: { name: 'System', role: 'system' },
          metadata: { courseId: 'cs101', roomId: 'room-b205' }
        },
        {
          _id: '2',
          title: 'New Course Assignment',
          message: user?.role === 'instructor' 
            ? 'You have been assigned to teach Advanced Database Systems (CS401) for the Spring 2025 semester.'
            : 'A new course has been added to your schedule: Advanced Database Systems (CS401)',
          type: 'info',
          priority: 'high',
          category: 'course',
          isRead: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          sender: { name: 'Dr. Sarah Johnson', role: 'admin' },
          metadata: { courseId: 'cs401' }
        },
        {
          _id: '3',
          title: 'Room Maintenance Scheduled',
          message: 'Lab B-205 will be unavailable for maintenance on December 15th from 9:00 AM to 12:00 PM.',
          type: 'warning',
          priority: 'high',
          category: 'room',
          isRead: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          sender: { name: 'Facilities Management', role: 'admin' },
          metadata: { roomId: 'lab-b205' }
        },
        {
          _id: '4',
          title: 'Grade Submission Reminder',
          message: user?.role === 'instructor'
            ? 'Reminder: Final grades for Fall 2024 are due by December 20th at 11:59 PM.'
            : 'Your instructor has submitted final grades for CS101.',
          type: 'info',
          priority: 'medium',
          category: 'course',
          isRead: user?.role !== 'instructor',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
          sender: { name: 'Academic Affairs', role: 'admin' }
        },
        {
          _id: '5',
          title: 'System Maintenance Tonight',
          message: 'SchedEase will be offline for maintenance tonight from 2:00 AM to 4:00 AM EST.',
          type: 'warning',
          priority: 'medium',
          category: 'system',
          isRead: false,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // Expires in 12 hours
          sender: { name: 'IT Support', role: 'admin' }
        }
      ];

      // Add role-specific notifications
      if (user?.role === 'admin') {
        mockNotifications.push(
          {
            _id: '6',
            title: 'New User Registration',
            message: '5 new users have registered and are pending approval.',
            type: 'info',
            priority: 'low',
            category: 'user',
            isRead: false,
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            sender: { name: 'System', role: 'system' }
          },
          {
            _id: '7',
            title: 'Low Room Utilization Alert',
            message: 'Room utilization in Science Building C has dropped below 60% this week.',
            type: 'warning',
            priority: 'medium',
            category: 'room',
            isRead: true,
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            sender: { name: 'Analytics System', role: 'system' }
          }
        );
      }

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification._id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification._id !== notificationId)
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <Check className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <X className="h-4 w-4 text-red-600" />;
      case 'schedule': return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'announcement': return <Bell className="h-4 w-4 text-purple-600" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'schedule': return <Calendar className="h-4 w-4" />;
      case 'course': return <BookOpen className="h-4 w-4" />;
      case 'room': return <MapPin className="h-4 w-4" />;
      case 'user': return <Users className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !notification.isRead) ||
                         (filter === 'read' && notification.isRead) ||
                         notification.category === filter ||
                         notification.type === filter;
    return matchesSearch && matchesFilter;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge className="bg-red-100 text-red-800">
                    {unreadCount} new
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Stay updated with important information and alerts
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" onClick={markAllAsRead}>
                  <Check className="h-4 w-4 mr-2" />
                  Mark All Read
                </Button>
              )}
              <Dialog open={showSettings} onOpenChange={setShowSettings}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Notification Settings</DialogTitle>
                    <DialogDescription>
                      Configure how you receive notifications
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-gray-500">Receive notifications via email</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) => setSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                        className="rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Schedule Changes</p>
                        <p className="text-sm text-gray-500">Get notified of schedule updates</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.scheduleChanges}
                        onChange={(e) => setSettings(prev => ({ ...prev, scheduleChanges: e.target.checked }))}
                        className="rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Announcements</p>
                        <p className="text-sm text-gray-500">Receive course and system announcements</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.announcements}
                        onChange={(e) => setSettings(prev => ({ ...prev, announcements: e.target.checked }))}
                        className="rounded"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">System Alerts</p>
                        <p className="text-sm text-gray-500">Important system notifications</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.systemAlerts}
                        onChange={(e) => setSettings(prev => ({ ...prev, systemAlerts: e.target.checked }))}
                        className="rounded"
                      />
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
              <option value="schedule">Schedule</option>
              <option value="course">Courses</option>
              <option value="room">Rooms</option>
              <option value="system">System</option>
              <option value="announcement">Announcements</option>
            </select>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading notifications...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications found</p>
                <p className="text-sm">You're all caught up!</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`p-4 border rounded-lg transition-all hover:shadow-md ${
                    notification.isRead ? 'bg-gray-50 border-gray-200' : 'bg-white border-blue-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className={`font-medium ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notification.title}
                          </h4>
                          <Badge className={getPriorityColor(notification.priority)} variant="outline">
                            {notification.priority}
                          </Badge>
                          <div className="flex items-center gap-1 text-gray-500">
                            {getCategoryIcon(notification.category)}
                            <span className="text-xs capitalize">{notification.category}</span>
                          </div>
                        </div>
                        <p className={`text-sm ${notification.isRead ? 'text-gray-600' : 'text-gray-800'} mb-2`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          {notification.sender && (
                            <span>From: {notification.sender.name}</span>
                          )}
                          {notification.expiresAt && (
                            <span className="text-orange-600">
                              Expires: {new Date(notification.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                      {!notification.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(notification._id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteNotification(notification._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}