import { apiClient, localDB } from './apiClient';

export const notificationApi = {
  getAll: async () => {
    try {
      const res = await apiClient.get('/notifications');
      return res.data;
    } catch {
      const db = localDB.get();
      return db.notifications;
    }
  },

  markAsRead: async (id) => {
    try {
      const res = await apiClient.put(`/notifications/${id}/read`);
      return res.data;
    } catch {
      const db = localDB.get();
      const notif = db.notifications.find((n) => n.id === id);
      if (notif) notif.read = true;
      localDB.save(db);
      return { success: true };
    }
  },

  markAllAsRead: async () => {
    try {
      const res = await apiClient.put('/notifications/mark-all-read');
      return res.data;
    } catch {
      const db = localDB.get();
      db.notifications.forEach((n) => (n.read = true));
      localDB.save(db);
      return { success: true };
    }
  },

  clear: async (id) => {
    try {
      const res = await apiClient.delete(`/notifications/${id}`);
      return res.data;
    } catch {
      const db = localDB.get();
      db.notifications = db.notifications.filter((n) => n.id !== id);
      localDB.save(db);
      return { success: true };
    }
  },
};
