import React, { useState, useEffect } from 'react';
import {
  Menu,
  Bell,
  Search,
  UserCheck,
  Sparkles,
  Shield,
  ChevronDown,
  Clock,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { Link } from 'react-router-dom';

export default function TopNav({ onMenuToggle }) {
  const { user, switchUser, isAdmin, isHR } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const demoPersonas = [
    {
      id: 'EMP-1001',
      name: 'Sarah Connor',
      role: 'ADMIN',
      dept: 'VP People Ops (Admin)',
      badge: 'Admin Access',
      color: 'rose',
    },
    {
      id: 'EMP-1002',
      name: 'Michael Vance',
      role: 'HR',
      dept: 'Senior HR Manager',
      badge: 'HR Access',
      color: 'amber',
    },
    {
      id: 'EMP-1003',
      name: 'Alex Morgan',
      role: 'EMPLOYEE',
      dept: 'Lead Cloud Architect',
      badge: 'Employee Access',
      color: 'blue',
    },
    {
      id: 'EMP-1004',
      name: 'Priya Sharma',
      role: 'EMPLOYEE',
      dept: 'Lead Product Designer',
      badge: 'Employee Access',
      color: 'purple',
    },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile Toggle & Brand indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Live System Time */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span className="tabular-nums font-mono text-slate-700">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="text-slate-400">|</span>
          <span>{currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* ONE-CLICK PERSONA SWITCHER (Crucial for Hackathon Evaluation) */}
        <div className="relative">
          <button
            onClick={() => {
              setShowPersonaMenu(!showPersonaMenu);
              setShowNotifMenu(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors shadow-xs"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Role Persona:</span>
            <span className="font-bold text-blue-900">{user?.role}</span>
            <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
          </button>

          {showPersonaMenu && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl bg-white p-2 shadow-2xl border border-slate-200 z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-800">Evaluator Persona Switcher</p>
                <p className="text-[11px] text-slate-500">Switch role to test instant RBAC enforcement</p>
              </div>

              {demoPersonas.map((p) => {
                const isActive = user?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      switchUser(p.id);
                      setShowPersonaMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      isActive ? 'bg-blue-600 text-white font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-bold">{p.name}</div>
                      <div className={`text-[10px] ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                        {p.dept}
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {p.role}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowPersonaMenu(false);
            }}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white shadow-2xl border border-slate-200 z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Notifications ({unreadCount})</span>
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifMenu(false)}
                  className="text-[11px] font-semibold text-blue-600 hover:underline"
                >
                  View All
                </Link>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.slice(0, 4).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                      !n.read ? 'bg-blue-50/40 font-medium' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.timestamp.split(' ')[1]}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-1 line-clamp-2">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            alt={user?.name || 'Avatar'}
            className="w-8 h-8 rounded-full object-cover border border-slate-200"
          />
          <div className="hidden xl:block text-left">
            <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name}</p>
            <p className="text-[10px] font-semibold text-slate-500">{user?.designation}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
