import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NotificationBell } from './NotificationBell';
import { Bot, LogOut, Sparkles, Clock, ShieldCheck, Sun, Moon, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar = ({ onOpenAIChat, onToggleMobileMenu }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const empDetails = user?.employee_details || {};
  const fullName = empDetails.first_name ? `${empDetails.first_name} ${empDetails.last_name}` : (user?.email || 'User');

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-3 sm:gap-6">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="p-2 rounded-xl border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 md:hidden transition-colors"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
            D
          </div>
          <div>
            <span className="font-extrabold text-base sm:text-lg text-slate-100 tracking-tight flex items-center gap-1.5">
              DAYFLOW
              <span className="hidden sm:inline-block text-[10px] bg-blue-500/20 text-blue-400 font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">
                Odoo x NMIT 2026
              </span>
            </span>
          </div>
        </div>

        {/* Live Clock */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>{time.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Actions, Theme Switcher & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Switcher Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-800 bg-slate-900/80 text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-medium"
          title={`Switch to ${theme === 'dark' ? 'White Enterprise Theme' : 'Dark Obsidian Theme'}`}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden xl:inline text-slate-300 text-[11px]">White Theme</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-500" />
              <span className="hidden xl:inline text-slate-700 text-[11px]">Dark Theme</span>
            </>
          )}
        </button>

        {/* AI Copilot Trigger */}
        <button
          onClick={onOpenAIChat}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-medium shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02]"
        >
          <Bot className="w-4 h-4" />
          <span className="hidden sm:inline">Ask AI Copilot</span>
          <Sparkles className="w-3 h-3 text-amber-300" />
        </button>

        {/* Notification Bell */}
        <NotificationBell />

        {/* User Pill */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-800">
          <Link to="/profile" className="flex items-center gap-2.5 group hover:opacity-80 transition-opacity">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-100 group-hover:text-blue-400 transition-colors truncate max-w-[120px]">
                {fullName}
              </p>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-slate-400 uppercase font-medium">{user?.role}</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-blue-400 overflow-hidden shrink-0">
              {empDetails.profile_picture_url ? (
                <img src={empDetails.profile_picture_url} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                fullName.charAt(0)
              )}
            </div>
          </Link>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
