import { SupabaseClient } from '@supabase/supabase-js';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface InAppNotification {
  id: string;
  user_id: string;
  tenant_id?: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  is_read: boolean;
  metadata: any;
  created_at: string;
}

export type NotificationChangeEvent = 
  | { event: 'INSERT'; new: InAppNotification }
  | { event: 'UPDATE'; new: InAppNotification }
  | { event: 'DELETE'; old: { id: string } };

export class InAppNotificationService {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async getNotifications(params: {
    userId: string;
    limit?: number;
    unreadOnly?: boolean;
  }) {
    let query = this.client
      .from('in_app_notifications')
      .select('*')
      .eq('user_id', params.userId)
      .order('created_at', { ascending: false });

    if (params.unreadOnly) {
        query = query.eq('is_read', false);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as InAppNotification[];
  }

  async getUnreadCount(userId: string) {
    const { count, error } = await this.client
      .from('in_app_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  }

  async markAsRead(notificationId: string) {
    const { error } = await this.client
      .from('in_app_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  }

  async markAllAsRead(userId: string) {
    const { error } = await this.client
      .from('in_app_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return true;
  }

  async deleteNotification(notificationId: string) {
    const { error } = await this.client
      .from('in_app_notifications')
      .delete()
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  }

  async deleteAllNotifications(userId: string) {
    const { error } = await this.client
      .from('in_app_notifications')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }

  /**
   * Create a new notification. Use Admin Client for system-level calls.
   */
  async createNotification(notification: Omit<InAppNotification, 'id' | 'is_read' | 'created_at'>) {
    const { data, error } = await this.client
      .from('in_app_notifications')
      .insert([notification])
      .select()
      .single();

    if (error) throw error;
    return data as InAppNotification;
  }


  /**
   * Subscribe to new notifications for a user
   */
  subscribeToNotifications(userId: string, callback: (payload: NotificationChangeEvent) => void, source: string = 'default') {
    return this.client
      .channel(`user-notifications-${userId}-${source}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'in_app_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            callback({ event: 'INSERT', new: payload.new as InAppNotification });
          } else if (payload.eventType === 'UPDATE') {
            callback({ event: 'UPDATE', new: payload.new as InAppNotification });
          } else if (payload.eventType === 'DELETE') {
            callback({ event: 'DELETE', old: payload.old as { id: string } });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Realtime subscription active for user ${userId} (${source})`);
        } else if (status === 'CHANNEL_ERROR') {
          console.warn(`Realtime subscription error for user ${userId} (${source}) - Check RLS policies or Table Replication`);
        } else if (status === 'TIMED_OUT') {
          console.warn(`Realtime subscription timed out for user ${userId} (${source})`);
        }
      });
  }
}
