import React, { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const { lastEvent } = useSocket();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data);
    } catch (e) {
      // silent catch
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (lastEvent) {
      fetchNotifications();
    }
  }, [lastEvent]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 'TRUE' } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter(n => n.is_read !== 'TRUE').length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 z-40 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="p-3 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[11px] bg-blue-500/20 text-blue-400 font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">No notifications</div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`p-3.5 transition-colors flex items-start justify-between gap-2 ${n.is_read === 'TRUE' ? 'bg-slate-900/40 opacity-70' : 'bg-slate-800/30'}`}
                  >
                    <div>
                      <p className="text-xs font-medium text-slate-200">{n.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {n.is_read !== 'TRUE' && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="text-slate-500 hover:text-emerald-400 p-1 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
