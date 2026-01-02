"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { InAppNotificationService, InAppNotification, NotificationChangeEvent } from '@/lib/services/in-app-notification-service';
import { toast } from 'sonner';

interface NotificationContextType {
  notifications: InAppNotification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: (params?: { limit?: number; unreadOnly?: boolean }) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  const supabase = createClient();
  const service = new InAppNotificationService(supabase);
  const subscriptionRef = useRef<any>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async (params?: { limit?: number; unreadOnly?: boolean }) => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      const list = await service.getNotifications({
        userId,
        limit: params?.limit,
        unreadOnly: params?.unreadOnly,
      });
      setNotifications(list);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error('Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Refresh unread count
  const refreshUnreadCount = useCallback(async () => {
    if (!userId) return;
    
    try {
      const count = await service.getUnreadCount(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [userId]);

  // Mark as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      await service.markAsRead(id);
      // Optimistically update local state
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark notification as read');
      // Revert on error
      await fetchNotifications();
      await refreshUnreadCount();
    }
  }, [fetchNotifications, refreshUnreadCount]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    
    try {
      await service.markAllAsRead(userId);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
      await fetchNotifications();
      await refreshUnreadCount();
    }
  }, [userId, fetchNotifications, refreshUnreadCount]);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const notification = notifications.find(n => n.id === id);
      await service.deleteNotification(id);
      
      // Optimistically update local state
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
      await fetchNotifications();
      await refreshUnreadCount();
    }
  }, [notifications, fetchNotifications, refreshUnreadCount]);

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    if (!userId) return;
    
    try {
      await service.deleteAllNotifications(userId);
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications deleted');
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
      toast.error('Failed to delete all notifications');
      await fetchNotifications();
      await refreshUnreadCount();
    }
  }, [userId, fetchNotifications, refreshUnreadCount]);

  // Initialize user and fetch initial data
  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    initUser();
  }, []);

  // Fetch initial notifications when user is set
  useEffect(() => {
    if (userId) {
      fetchNotifications({ limit: 50 });
      refreshUnreadCount();
    }
  }, [userId, fetchNotifications, refreshUnreadCount]);

  // Set up realtime subscription (only once)
  useEffect(() => {
    if (!userId) return;

    let pollingInterval: NodeJS.Timeout | null = null;

    const setupRealtime = async () => {
      // Clean up existing subscription if any
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }

      try {
        subscriptionRef.current = service.subscribeToNotifications(
          userId,
          (payload: NotificationChangeEvent) => {
            if (payload.event === 'INSERT') {
              const newNotification = payload.new;
              
              setNotifications(prev => {
                // Prevent duplicates
                if (prev.some(n => n.id === newNotification.id)) {
                  return prev;
                }
                return [newNotification, ...prev];
              });
              
              setUnreadCount(prev => prev + 1);
              
              // Show toast notification
              toast.info(newNotification.title, {
                description: newNotification.message,
              });
            } else if (payload.event === 'UPDATE') {
              const updatedNotification = payload.new;
              
              setNotifications(prev => {
                const oldNotification = prev.find(n => n.id === updatedNotification.id);
                
                // Adjust unread count if read status changed
                if (oldNotification && !oldNotification.is_read && updatedNotification.is_read) {
                  setUnreadCount(c => Math.max(0, c - 1));
                } else if (oldNotification && oldNotification.is_read && !updatedNotification.is_read) {
                  setUnreadCount(c => c + 1);
                }
                
                return prev.map(n => n.id === updatedNotification.id ? updatedNotification : n);
              });
            } else if (payload.event === 'DELETE') {
              const deletedId = payload.old.id;
              
              setNotifications(prev => {
                const deleted = prev.find(n => n.id === deletedId);
                if (deleted && !deleted.is_read) {
                  setUnreadCount(c => Math.max(0, c - 1));
                }
                return prev.filter(n => n.id !== deletedId);
              });
            }
          },
          'global' // Single global subscription
        );

        // Monitor subscription status
        const channel = subscriptionRef.current;
        
        // Check subscription state after a delay
        setTimeout(() => {
          const state = channel?.state;
          console.log('Realtime subscription state:', state);
          
          if (state !== 'joined') {
            console.warn('Realtime subscription not active, falling back to polling');
            toast.warning('Real-time updates unavailable, using polling instead');
            
            // Fallback to polling every 30 seconds
            pollingInterval = setInterval(() => {
              console.log('Polling for new notifications...');
              fetchNotifications({ limit: 50 });
              refreshUnreadCount();
            }, 30000);
          }
        }, 3000);

      } catch (error) {
        console.error('Failed to setup Realtime subscription:', error);
        toast.error('Failed to setup real-time notifications');
        
        // Fallback to polling
        pollingInterval = setInterval(() => {
          fetchNotifications({ limit: 50 });
          refreshUnreadCount();
        }, 30000);
      }
    };

    setupRealtime();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [userId, fetchNotifications, refreshUnreadCount]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refreshUnreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
