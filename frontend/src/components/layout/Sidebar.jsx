import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarCheck,
  CreditCard,
  Sparkles,
  Bot,
  History,
  ShieldCheck,
  Bell,
  Building2,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, isAdmin, isHR, isManagement, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const navigation = [
    {
      name: isManagement ? 'Command Center' : 'My Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'HR', 'EMPLOYEE'],
    },
    {
      name: 'Employees Directory',
      path: '/employees',
      icon: Users,
      roles: ['ADMIN', 'HR', 'EMPLOYEE'],
    },
    {
      name: 'Attendance & Time',
      path: '/attendance',
      icon: Clock,
      roles: ['ADMIN', 'HR', 'EMPLOYEE'],
    },
    {
      name: 'Leaves & Time-Off',
      path: '/leaves',
      icon: CalendarCheck,
      roles: ['ADMIN', 'HR', 'EMPLOYEE'],
    },
    {
      name: 'Payroll & Comp',
      path: '/payroll',
      icon: CreditCard,
      roles: ['ADMIN', 'HR', 'EMPLOYEE'],
    },
    {
      name: 'AI Workforce Insights',
      path: '/ai-insights',
      icon: Sparkles,
      roles: ['ADMIN', 'HR', 'EMPLOYEE'],
      highlight: true,
    },
    {
      name: 'AI HR Copilot',
      path: '/ai-copilot',
      icon: Bot,
      roles: ['ADMIN', 'HR', 'EMPLOYEE'],
      badge: 'AI',
    },
    {
      name: 'Workday Timeline',
      path: '/timeline',
      icon: History,
      roles: ['ADMIN', 'HR', 'EMPLOYEE'],
    },
    {
      name: 'Audit Logs & Security',
      path: '/audit',
      icon: ShieldCheck,
      roles: ['ADMIN', 'HR'], // Restricted to Admin/HR
    },
    {
      name: 'Notifications',
      path: '/notifications',
      icon: Bell,
      roles: ['ADMIN', 'HR', 'EMPLOYEE'],
      badgeCount: unreadCount,
    },
  ];

  const filteredNav = navigation.filter((item) => item.roles.includes(user?.role || 'EMPLOYEE'));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } border-r border-slate-800`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-base tracking-tight">DAYFLOW</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  AI-Native
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Workforce Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Platform Modules
          </p>

          {filteredNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-bold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                      {item.badge}
                    </span>
                  )}
                  {item.badgeCount > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                      {item.badgeCount}
                    </span>
                  )}
                  {item.highlight && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>
              </NavLink>
            );
          })}
        </div>

        {/* User Card & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                alt={user?.name || 'User'}
                className="w-8 h-8 rounded-full object-cover border border-slate-600"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Guest User'}</p>
                <span className="text-[10px] font-semibold text-blue-400 block truncate">
                  {user?.role} • {user?.department?.split(' ')[0]}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
