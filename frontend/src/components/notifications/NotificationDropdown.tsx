import React, { useRef, useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Bell } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Notification } from './notificationsApi';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../ui/utils';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  isLoading?: boolean;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  isLoading = false,
}: NotificationDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (e.target instanceof Node && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <Button
        variant="ghost"
        size="icon"
        className={cn('relative', open && 'ring-2 ring-offset-2 ring-primary/30')}
        onClick={() => setOpen(v => !v)}
        disabled={isLoading}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Bell className={cn(unreadCount > 0 ? 'animate-bell' : '')} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full bg-red-600 text-white text-xs font-semibold animate-pulse">
            {unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 z-50 rounded-md border bg-white text-foreground shadow-md dark:bg-gray-800 dark:text-white">
          <div className="flex items-center justify-between px-3 py-2 border-b">
            <span className="font-medium">Notifications</span>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => { onMarkAllAsRead(); }} className="text-xs">
                Mark all as read
              </Button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => onMarkAsRead(notification.id)}
                  className={cn(
                    'w-full text-left p-3 border-b last:border-b-0',
                    !notification.read
                      ? 'bg-red-50 dark:bg-red-900/40'
                      : 'bg-white dark:bg-gray-800'
                  )}
                >
                  <div className="font-semibold">{notification.title}</div>
                  <div className="text-sm text-muted-foreground">{notification.message}</div>
                  <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}