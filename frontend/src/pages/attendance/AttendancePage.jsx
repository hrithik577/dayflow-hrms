import React, { useState, useEffect } from 'react';
import {
  Clock,
  LogIn,
  LogOut,
  Calendar,
  Filter,
  Download,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  MapPin,
  Building,
  UserCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { attendanceApi } from '../../services/attendanceApi';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { DEPARTMENTS, ATTENDANCE_STATUS } from '../../utils/constants';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export default function AttendancePage() {
  const { user, isManagement } = useAuth();
  const { showToast } = useNotifications();

  const [todayRecord, setTodayRecord] = useState(null);
  const [orgAttendance, setOrgAttendance] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [workMode, setWorkMode] = useState('In-Office');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Digital clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rec, orgList, statRes] = await Promise.all([
        attendanceApi.getToday(user.id),
        attendanceApi.getOrgAttendance(null, selectedDept),
        attendanceApi.getAttendanceStats(),
      ]);
      setTodayRecord(rec);
      setOrgAttendance(orgList);
      setStats(statRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id, selectedDept]);

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      const rec = await attendanceApi.checkIn({
        employeeId: user.id,
        employeeName: user.name,
        department: user.department,
        workMode,
      });
      setTodayRecord(rec);
      showToast('Checked in successfully! Shift started.', 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      const rec = await attendanceApi.checkOut({ employeeId: user.id });
      setTodayRecord(rec);
      showToast('Checked out successfully. Shift completed.', 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Employee ID', 'Name', 'Department', 'Date', 'Check In', 'Check Out', 'Status', 'Total Hours', 'Work Mode'];
    const rows = orgAttendance.map((a) => [
      a.employeeId,
      a.employeeName,
      a.department,
      a.date,
      a.checkIn || '—',
      a.checkOut || '—',
      a.status,
      a.totalHours,
      a.workMode,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Dayflow_Attendance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Attendance report exported to CSV.', 'info');
  };

  const isCheckedIn = !!todayRecord?.checkIn && !todayRecord?.checkOut;
  const isCompleted = !!todayRecord?.checkOut;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Attendance & Time Tracking</h1>
          <p className="text-xs text-slate-500">
            Daily biometric & remote punch telemetry, punctuality analysis, and organization logs.
          </p>
        </div>

        {isManagement && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            icon={Download}
            className="font-bold"
          >
            Export Attendance CSV
          </Button>
        )}
      </div>

      {/* Attendance Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="enterprise-card p-4">
            <span className="text-[11px] font-bold uppercase text-slate-500">Attendance Rate</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-blue-600 tabular-nums">{stats.attendanceRate}%</span>
              <span className="text-[10px] text-emerald-600 font-bold">+2.4% vs last week</span>
            </div>
          </div>
          <div className="enterprise-card p-4 border-emerald-200 bg-emerald-50/20">
            <span className="text-[11px] font-bold uppercase text-emerald-700">Present Today</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-emerald-800 tabular-nums">{stats.presentCount}</span>
              <span className="text-[10px] text-emerald-600 font-medium">employees</span>
            </div>
          </div>
          <div className="enterprise-card p-4 border-amber-200 bg-amber-50/20">
            <span className="text-[11px] font-bold uppercase text-amber-700">Late Arrivals</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-amber-800 tabular-nums">{stats.lateCount}</span>
              <span className="text-[10px] text-amber-600 font-medium">after 9:10 AM</span>
            </div>
          </div>
          <div className="enterprise-card p-4 border-rose-200 bg-rose-50/20">
            <span className="text-[11px] font-bold uppercase text-rose-700">Absent / Unlogged</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-rose-800 tabular-nums">{stats.absentCount}</span>
              <span className="text-[10px] text-rose-600 font-medium">employees</span>
            </div>
          </div>
        </div>
      )}

      {/* Personal Punch-In Terminal Card */}
      <div className="enterprise-card p-6 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 text-white rounded-2xl border-none shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Personal Punch Terminal
              </span>
              <span className="text-xs text-slate-400 font-mono">Terminal IP: 192.168.10.45</span>
            </div>

            <div className="mt-3 flex items-baseline gap-4">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tabular-nums tracking-tight">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-sm font-semibold text-slate-300">
                {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-4 text-xs text-slate-300">
              <div>
                Status:{' '}
                <strong className={isCheckedIn ? 'text-emerald-400' : isCompleted ? 'text-blue-400' : 'text-amber-400'}>
                  {isCheckedIn ? 'Clocked In (Active Shift)' : isCompleted ? 'Day Shift Completed' : 'Not Clocked In'}
                </strong>
              </div>
              {todayRecord?.checkIn && <div>Check In: <strong>{todayRecord.checkIn}</strong></div>}
              {todayRecord?.checkOut && <div>Check Out: <strong>{todayRecord.checkOut}</strong></div>}
            </div>
          </div>

          {/* Action & Work Mode Selection */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {!isCheckedIn && !isCompleted && (
              <div className="flex items-center rounded-lg bg-slate-800/80 p-1 border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setWorkMode('In-Office')}
                  className={`px-3 py-1.5 rounded-md font-semibold ${
                    workMode === 'In-Office' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  In-Office
                </button>
                <button
                  type="button"
                  onClick={() => setWorkMode('Remote')}
                  className={`px-3 py-1.5 rounded-md font-semibold ${
                    workMode === 'Remote' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Remote VPN
                </button>
              </div>
            )}

            {!isCheckedIn && !isCompleted && (
              <Button
                variant="success"
                size="lg"
                loading={actionLoading}
                onClick={handleCheckIn}
                icon={LogIn}
                className="w-full sm:w-auto font-bold shadow-lg"
              >
                Punch In Now
              </Button>
            )}

            {isCheckedIn && (
              <Button
                variant="danger"
                size="lg"
                loading={actionLoading}
                onClick={handleCheckOut}
                icon={LogOut}
                className="w-full sm:w-auto font-bold shadow-lg"
              >
                Punch Out
              </Button>
            )}

            {isCompleted && (
              <div className="px-4 py-2.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Shift Logged ({todayRecord.totalHours})
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Organization Attendance Roster (Admin / HR) */}
      <div className="enterprise-card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Today's Organization Attendance Roster</h3>
            <p className="text-xs text-slate-500">Live employee punch log and punctuality verification</p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="py-1.5 px-3 text-xs border border-slate-300 rounded-lg bg-white font-medium"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Department</th>
                <th className="px-6 py-3.5">Check In</th>
                <th className="px-6 py-3.5">Check Out</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Total Hours</th>
                <th className="px-6 py-3.5">Mode & IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {orgAttendance.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3.5">
                    <span className="font-bold text-slate-900">{rec.employeeName}</span>
                    <span className="text-[11px] text-slate-400 block font-mono">{rec.employeeId}</span>
                  </td>
                  <td className="px-6 py-3.5">{rec.department}</td>
                  <td className="px-6 py-3.5 font-mono text-slate-800">{rec.checkIn || '—'}</td>
                  <td className="px-6 py-3.5 font-mono text-slate-800">{rec.checkOut || '—'}</td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                        rec.status === 'PRESENT'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : rec.status === 'LATE'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : rec.status === 'ON_LEAVE'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {rec.status}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-mono font-bold text-slate-900">{rec.totalHours}</td>
                  <td className="px-6 py-3.5 text-[11px] text-slate-500">
                    <div>{rec.workMode}</div>
                    <div className="font-mono text-[10px] text-slate-400">{rec.ipAddress}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
