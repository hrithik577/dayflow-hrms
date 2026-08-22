import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from './NotificationBell';
import { Bot, LogOut, Sparkles, Clock, ShieldCheck } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export const Navbar = ({ onOpenAIChat }) => {
  const { user, logout } = useAuth();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const empDetails = user?.employee_details || {};
  const fullName = empDetails.first_name ? `${empDetails.first_name} ${empDetails.last_name}` : (user?.email || 'User');

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Time */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            D
          </div>
          <div>
            <span className="font-extrabold text-lg text-slate-100 tracking-tight flex items-center gap-1.5">
              DAYFLOW
              <span className="text-[10px] bg-blue-500/20 text-blue-400 font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">
                Odoo x NMIT 2026
              </span>
            </span>
          </div>
        </div>

        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>{time.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Actions & Profile */}
      <div className="flex items-center gap-3">
        {/* AI Copilot Trigger */}
        <button
          onClick={onOpenAIChat}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-medium shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02]"
        >
          <Bot className="w-4 h-4" />
          <span className="hidden sm:inline">Ask AI Copilot</span>
          <Sparkles className="w-3 h-3 text-amber-300" />
        </button>

        {/* Notification Bell */}
        <NotificationBell />

        {/* User Pill */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-semibold text-slate-100">{fullName}</p>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-slate-400 uppercase font-medium">{user?.role}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400">
            {fullName.charAt(0)}
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
