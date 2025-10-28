import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  GraduationCap, 
  LogOut, 
  Menu, 
  Settings, 
  User, 
  Bell,
  Sun,
  Moon
} from 'lucide-react';
import { NotificationDropdown } from '../notifications/NotificationDropdown';
import { notificationsApi, Notification } from '../notifications/notificationsApi';
import { cn } from '../ui/utils';
import { toast } from 'sonner';

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarItems: Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    href?: string;
    onClick?: () => void;
    active?: boolean;
  }>;
  currentPage: string;
}

export function DashboardLayout({ children, sidebarItems, currentPage }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Set up polling for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const data = await notificationsApi.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Add mock notifications for testing when API fails
      setNotifications([
        {
          id: '1',
          title: 'New Schedule Update',
          message: 'Your class schedule has been updated for next week.',
          createdAt: new Date().toISOString(),
          read: false,
          role: user?.role
        },
        {
          id: '2',
          title: 'Room Change',
          message: 'Your next class has been moved to Room 201.',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          read: true,
          role: user?.role
        }
      ]);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const computeDisplayName = () => {
    const src = user || (() => {
      try {
        const raw = localStorage.getItem('currentUser');
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    })();
    if (!src) return 'User';
    const nameFields = [src.fullName, src.name, src.displayName, src.firstName ? `${src.firstName} ${src.lastName || ''}` : undefined];
    for (const f of nameFields) {
      if (f && typeof f === 'string' && f.trim()) return f.trim();
    }
    const email = src.email;
    if (email && typeof email === 'string') {
      const local = email.split('@')[0];
      const parts = local.split(/[._\-]/).filter(Boolean);
      const human = parts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      if (human) return human;
    }
    return 'User';
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'instructor': return 'bg-blue-100 text-blue-800';
      case 'student': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="flex items-center space-x-2 p-6 border-b">
        <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">SchedEase</h2>
          <p className="text-xs text-gray-500">s</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {sidebarItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={item.onClick}
              className={cn(
                "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors",
                item.active
                  ? "bg-blue-50 text-blue-700 border-l-4 border-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Info in Sidebar */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-700">
              {getUserInitials(user?.fullName || 'User')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.fullName}
            </p>
            <Badge className={cn("text-xs", getRoleColor(user?.role))}>
              {user?.role}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className="lg:hidden">
        {sidebarOpen && (
          <div className="fixed inset-0 z-40">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed top-0 left-0 w-64 h-full bg-white shadow-lg z-50">
              <SidebarContent />
            </div>
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:block">
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">{currentPage}</h1>
                  <p className="text-sm text-gray-500">
                    Welcome back, {computeDisplayName()}
                  </p>
                </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <NotificationDropdown
                notifications={notifications}
                unreadCount={notifications.filter(n => !n.read).length}
                onMarkAsRead={handleMarkAsRead}
                onMarkAllAsRead={handleMarkAllAsRead}
                isLoading={isLoadingNotifications}
              />

              {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
          >
            {darkMode ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>              {/* User menu */}
              <div className="relative">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700">
                        {getUserInitials(computeDisplayName())}
                      </span>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-sm font-medium text-gray-900">{computeDisplayName()}</p>
                      <Badge className={cn("text-xs", getRoleColor(user?.role))}>
                        {user?.role}
                      </Badge>
                    </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-red-600 hover:text-red-700"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline ml-2">Logout</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}