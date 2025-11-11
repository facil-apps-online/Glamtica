import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient'; // Asumiendo que tienes un cliente supabase exportado

// El tipo de una notificación, debería coincidir con lo que devuelve la API
export interface Notification {
  id: string;
  created_at: string;
  title: string;
  body: string;
  link_to: string;
  read_at: string | null;
  // ... otros campos que definimos en la tabla
  type: string;
  user_id: string;
  tenant_id: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  setNotifications: (notifications: Notification[]) => {
    const count = notifications.filter(n => !n.read_at).length;
    set({ notifications, unreadCount: count });
  },

  markAsRead: async (notificationId: string) => {
    try {
      await supabase.functions.invoke('tenant-actions', {
        body: { 
          action: 'MARK_NOTIFICATION_AS_READ', 
          payload: { notification_id: notificationId }
        }
      });
      // Actualizar el estado localmente para reflejar el cambio inmediatamente
      set(state => ({
        notifications: state.notifications.map(n => 
          n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  },

  markAllAsRead: async () => {
    try {
      await supabase.functions.invoke('tenant-actions', {
        body: { 
          action: 'MARK_ALL_NOTIFICATIONS_AS_READ', 
          payload: {}
        }
      });
      // Actualizar el estado localmente
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read_at: new Date().toISOString() })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  },

  addNotification: (notification: Notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },

  setUnreadCount: (count: number) => {
    set({ unreadCount: count });
  }
}));