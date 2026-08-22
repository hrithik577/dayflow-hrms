import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { StatCard } from '../components/StatCard';
import { LogIn, LogOut, Clock, CalendarDays, DollarSign, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export const EmployeeDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notes, setNotes] = useState('');

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/api/dashboard/employee');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await api.post('/api/attendance/check-in', { notes, source: 'WEB' });
      setNotes('');
      await fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.detail || 'Check-in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await api.post('/api/attendance/check-out', { notes });
      setNotes('');
      await fetchDashboard();
    } catch (err) {
      alert(err.response?.data?.detail || 'Check-out failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-slate-800 rounded-xl" />
        <div className="h-48 bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-800 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const emp = data?.employee_info || {};
  const todaySt = data?.today_status || {};
  const balances = data?.leave_balances || [];
  const weeklyTrend = data?.weekly_trend || [];
  const timeline = data?.timeline || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            Good day, {emp.name}! 👋
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {emp.designation} • {emp.department} • Code: {emp.employee_code}
          </p>
        </div>
        <StatusBadge status={todaySt.status} />
      </div>

      {/* Hero Attendance Action Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-400" />
              Today's Attendance Status
            </span>
            <div className="flex items-baseline gap-4">
              <h2 className="text-3xl font-extrabold text-slate-50">{todaySt.status.replace(/_/g, ' ')}</h2>
              {todaySt.check_in && (
                <span className="text-xs text-slate-400 font-mono">
                  Check-in: <strong className="text-slate-200">{todaySt.check_in}</strong>
                  {todaySt.check_out && <> • Check-out: <strong className="text-slate-200">{todaySt.check_out}</strong></>}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Total Logged Hours Today: <span className="text-blue-400 font-bold text-sm">{todaySt.working_hours} hrs</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {!todaySt.is_checked_in && !todaySt.check_out && (
              <button
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50"
              >
                <LogIn className="w-4 h-4" />
                <span>Check In Now</span>
              </button>
            )}

            {todaySt.is_checked_in && (
              <button
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Check Out</span>
              </button>
            )}

            {todaySt.check_out && (
              <div className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Attendance Completed for Today
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stat Cards - Leave Balances */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Leave Balances Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {balances.map((b, idx) => (
            <StatCard
              key={idx}
              title={b.type}
              value={`${b.remaining} Days`}
              subtitle={`Allocated: ${b.allocated} • Used: ${b.used}`}
              icon={CalendarDays}
              color={idx % 2 === 0 ? "blue" : "emerald"}
            />
          ))}
        </div>
      </div>

      {/* Charts & Personal Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mini Attendance Trend Chart */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            Weekly Attendance & Hours Logged
          </h3>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyTrend}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="hours" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity & Audit Timeline */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            Personal Activity Log
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {timeline.length === 0 ? (
              <p className="text-xs text-slate-500">No activity logged yet.</p>
            ) : (
              timeline.map(item => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-blue-400">{item.action}</span>
                    <span className="text-slate-500">{item.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-300 truncate">{item.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
