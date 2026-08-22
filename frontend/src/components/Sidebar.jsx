import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  DollarSign,
  BrainCircuit,
  Bot,
  FileCheck2,
  Settings
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role || 'EMPLOYEE';
  const isHR = role === 'HR' || role === 'ADMIN';

  const navItems = isHR ? [
    { label: 'Command Center', path: '/', icon: LayoutDashboard },
    { label: 'Employee Directory', path: '/employees', icon: Users },
    { label: 'Attendance Logs', path: '/attendance', icon: Clock },
    { label: 'Leave Requests', path: '/leave', icon: CalendarDays },
    { label: 'Payroll Hub', path: '/payroll', icon: DollarSign },
    { label: 'AI Attention Signals', path: '/ai-insights', icon: BrainCircuit },
    { label: 'AI Copilot Workspace', path: '/ai-copilot', icon: Bot },
    { label: 'System Audit Logs', path: '/audit', icon: FileCheck2 },
  ] : [
    { label: 'My Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'My Attendance', path: '/attendance', icon: Clock },
    { label: 'My Leave Requests', path: '/leave', icon: CalendarDays },
    { label: 'My Payslips', path: '/payroll', icon: DollarSign },
    { label: 'AI Copilot Assistant', path: '/ai-copilot', icon: Bot },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/60 flex flex-col justify-between p-4 shrink-0 hidden md:flex">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            {isHR ? 'HR Command Center' : 'Employee Portal'}
          </p>
          <nav className="mt-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer info */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-slate-300">Engine Online</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">PostgreSQL DB • AI Guardrails Active</p>
      </div>
    </aside>
  );
};
