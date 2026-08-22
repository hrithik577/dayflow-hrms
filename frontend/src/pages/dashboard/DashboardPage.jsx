import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import EmployeeDashboardView from '../../components/dashboard/EmployeeDashboardView';
import AdminCommandCenterView from '../../components/dashboard/AdminCommandCenterView';
import { LayoutDashboard, Shield, User } from 'lucide-react';

export default function DashboardPage() {
  const { user, isManagement } = useAuth();
  // View mode allows explicit override so evaluators can inspect both views
  const [viewMode, setViewMode] = useState(isManagement ? 'admin' : 'employee');

  return (
    <div className="space-y-4">
      {/* Evaluator View Mode Switcher */}
      <div className="flex items-center justify-end">
        <div className="inline-flex rounded-lg bg-slate-200 p-1 text-xs font-semibold">
          <button
            onClick={() => setViewMode('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              viewMode === 'admin'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            Admin Command Center
          </button>
          <button
            onClick={() => setViewMode('employee')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
              viewMode === 'employee'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 text-emerald-600" />
            Employee Dashboard
          </button>
        </div>
      </div>

      {viewMode === 'admin' ? <AdminCommandCenterView /> : <EmployeeDashboardView />}
    </div>
  );
}
