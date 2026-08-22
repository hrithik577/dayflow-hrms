import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { Clock, Filter, LogIn, LogOut, CheckCircle2, Calendar } from 'lucide-react';

export const AttendancePage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'weekly'
  const [actionLoading, setActionLoading] = useState(false);
  const [checkedInToday, setCheckedInToday] = useState(false);

  const { user, isRole } = useAuth();
  const isHR = isRole('HR', 'ADMIN');

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const endpoint = isHR ? `/api/attendance?status_filter=${statusFilter}` : '/api/attendance/me';
      const res = await api.get(endpoint);
      setRecords(res.data);
      
      const todayStr = new Date().toISOString().split('T')[0];
      const todayRecord = res.data.find(r => r.date === todayStr);
      setCheckedInToday(Boolean(todayRecord && todayRecord.check_in && !todayRecord.check_out));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [statusFilter]);

  const handleCheckInOut = async () => {
    setActionLoading(true);
    try {
      const endpoint = checkedInToday ? '/api/attendance/check-out' : '/api/attendance/check-in';
      await api.post(endpoint);
      await fetchAttendance();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update attendance status');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRecords = records.filter(r => {
    if (viewMode === 'weekly') {
      const recDate = new Date(r.date);
      const now = new Date();
      const diffTime = Math.abs(now - recDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    return true;
  });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Employee Check-in Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-400" />
            {isHR ? 'Workforce Attendance Logs' : 'My Attendance History'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">Track check-ins, check-outs, daily logs, and weekly summaries</p>
        </div>

        {!isHR && (
          <button
            onClick={handleCheckInOut}
            disabled={actionLoading}
            className={`px-4 py-2.5 rounded-xl text-white font-semibold text-xs shadow-lg transition-all flex items-center gap-2 self-start sm:self-auto ${
              checkedInToday
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
            }`}
          >
            {checkedInToday ? <LogOut className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            {actionLoading ? 'Processing...' : checkedInToday ? 'Check Out Now' : 'Check In Now'}
          </button>
        )}
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              viewMode === 'daily'
                ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Daily Log View
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              viewMode === 'weekly'
                ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Weekly Summary (Last 7 Days)
          </button>
        </div>

        {isHR && (
          <div className="flex items-center gap-2 px-2 self-end sm:self-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="HALF_DAY">Half-day</option>
              <option value="ABSENT">Absent</option>
              <option value="LEAVE">Leave</option>
            </select>
          </div>
        )}
      </div>

      {/* Attendance Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 min-w-[700px]">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Check-In</th>
                <th className="px-6 py-4">Check-Out</th>
                <th className="px-6 py-4">Working Hours</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading attendance history...</td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No attendance records found</td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-200">{r.date}</td>
                    <td className="px-6 py-4 font-semibold text-slate-100">{r.employee_name || 'Me'}</td>
                    <td className="px-6 py-4 text-slate-400">{r.department_name}</td>
                    <td className="px-6 py-4 font-mono text-slate-300">
                      {r.check_in ? new Date(r.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">
                      {r.check_out ? new Date(r.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-blue-400">{r.working_hours} hrs</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
