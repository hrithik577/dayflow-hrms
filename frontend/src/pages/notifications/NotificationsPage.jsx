import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  Clock,
  Sparkles,
  CreditCard,
  ArrowRight,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useNavigate } from 'react-router-dom';

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const filtered = notifications.filter(
    (n) => selectedCategory === 'ALL' || n.category === selectedCategory
  );

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'LEAVE':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'ATTENDANCE':
        return <Clock className="w-4 h-4 text-emerald-600" />;
      case 'AI':
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
      case 'PAYROLL':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              <Bell className="w-3.5 h-3.5 text-blue-600" /> Notifications & Action Hub
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
            Notification Center
          </h1>
          <p className="text-xs text-slate-500">
            Real-time notifications for leave approvals, attendance alerts, AI observations, and payroll releases.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="secondary"
            size="sm"
            onClick={markAllAsRead}
            icon={CheckCheck}
            className="font-bold"
          >
            Mark All as Read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="enterprise-card p-3 flex items-center gap-2 text-xs font-semibold overflow-x-auto">
        {['ALL', 'LEAVE', 'ATTENDANCE', 'AI', 'PAYROLL'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-slate-900 text-white font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {cat === 'ALL' ? 'All Alerts' : cat}
          </button>
        ))}
      </div>

      {/* Notification Items List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="enterprise-card p-8 text-center text-slate-400 text-xs">
            No notifications found in this category.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => markAsRead(item.id)}
              className={`enterprise-card p-4 flex items-start justify-between gap-4 transition-all cursor-pointer ${
                !item.read ? 'bg-blue-50/30 border-blue-200' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-xs mt-0.5">
                  {getCategoryIcon(item.category)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{item.title}</span>
                    {!item.read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600">{item.message}</p>
                  <span className="text-[10px] text-slate-400 block font-mono">{item.timestamp}</span>
                </div>
              </div>

              {item.link && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(item.id);
                    navigate(item.link);
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 flex-shrink-0 cursor-pointer"
                >
                  View Details <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
