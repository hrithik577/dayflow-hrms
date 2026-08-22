import React, { useState, useEffect } from 'react';
import {
  Clock,
  LogIn,
  LogOut,
  CalendarCheck,
  CreditCard,
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  FileText,
  ArrowUpRight,
  ShieldAlert,
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
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { attendanceApi } from '../../services/attendanceApi';
import { dashboardApi } from '../../services/dashboardApi';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { useNavigate } from 'react-router-dom';

export default function EmployeeDashboardView() {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todayRecord, setTodayRecord] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getEmployeeDashboard(user.id);
      setData(res);
      setTodayRecord(res.todayAttendance);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadDashboard();
    }
  }, [user?.id]);

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      const rec = await attendanceApi.checkIn({
        employeeId: user.id,
        employeeName: user.name,
        department: user.department,
        workMode: 'In-Office',
      });
      setTodayRecord(rec);
      showToast('Checked in successfully!', 'success');
      loadDashboard();
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
      showToast('Checked out successfully. Have a great evening!', 'success');
      loadDashboard();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-32 bg-slate-200 rounded-xl" />
          <div className="h-32 bg-slate-200 rounded-xl" />
          <div className="h-32 bg-slate-200 rounded-xl" />
          <div className="h-32 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  const isCheckedIn = !!todayRecord?.checkIn && !todayRecord?.checkOut;
  const isCompleted = !!todayRecord?.checkOut;

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="enterprise-card bg-gradient-to-r from-blue-900 to-slate-900 text-white p-6 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-none shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
              {user.department}
            </span>
            <span className="text-xs text-slate-300 font-medium">Employee ID: {user.id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Good day, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            {todayRecord?.checkIn
              ? `You clocked in at ${todayRecord.checkIn}. Shift is currently active.`
              : 'You have not checked in yet for today.'}
          </p>
        </div>

        {/* Attendance Action Button inside Banner */}
        <div className="flex items-center gap-3">
          {!isCheckedIn && !isCompleted && (
            <Button
              variant="success"
              size="lg"
              loading={actionLoading}
              onClick={handleCheckIn}
              icon={LogIn}
              className="shadow-lg font-bold"
            >
              Punch In Today
            </Button>
          )}

          {isCheckedIn && (
            <Button
              variant="danger"
              size="lg"
              loading={actionLoading}
              onClick={handleCheckOut}
              icon={LogOut}
              className="shadow-lg font-bold"
            >
              Punch Out
            </Button>
          )}

          {isCompleted && (
            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 px-4 py-2 rounded-lg text-xs font-bold">
              <CheckCircle className="w-4 h-4" />
              Day Shift Completed ({todayRecord.totalHours})
            </div>
          )}
        </div>
      </div>

      {/* Primary KPI & Balances Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Working Hours */}
        <div className="enterprise-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Hours</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {todayRecord?.totalHours || (isCheckedIn ? '4h 30m' : '0h 00m')}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ 8.0 hrs expected</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: isCheckedIn ? '56%' : isCompleted ? '100%' : '0%' }}
            />
          </div>
        </div>

        {/* Paid Leave Balance */}
        <div className="enterprise-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Paid Leave Balance</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {user.leaveBalances?.PAID?.remaining || 14}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              days remaining of {user.leaveBalances?.PAID?.total || 18}
            </span>
          </div>
          <div className="mt-3 text-xs text-emerald-700 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Quota healthy for Q3
          </div>
        </div>

        {/* Sick & Casual Leave */}
        <div className="enterprise-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sick & Casual</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <div>
              <span className="text-xl font-bold text-slate-900 tabular-nums">
                {user.leaveBalances?.SICK?.remaining || 7}
              </span>
              <span className="text-[11px] text-slate-500 ml-1">Sick</span>
            </div>
            <span className="text-slate-300">|</span>
            <div>
              <span className="text-xl font-bold text-slate-900 tabular-nums">
                {user.leaveBalances?.CASUAL?.remaining || 4}
              </span>
              <span className="text-[11px] text-slate-500 ml-1">Casual</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            {data.pendingLeaves.length > 0
              ? `${data.pendingLeaves.length} pending request undergoing HR review`
              : 'No pending leave requests'}
          </div>
        </div>

        {/* Net Monthly Salary Summary */}
        <div className="enterprise-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Net Pay</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {formatCurrency(user.salary?.netSalary)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-blue-600 font-semibold">
            <button
              onClick={() => navigate('/payroll')}
              className="hover:underline flex items-center gap-1 cursor-pointer"
            >
              View Pay Statement <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Charts & Activity Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Weekly Attendance Chart */}
        <div className="lg:col-span-2 enterprise-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Weekly Logged Hours</h3>
              <p className="text-xs text-slate-500">Actual logged working hours vs standard 8.0h shift</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/attendance')}
              className="text-xs"
            >
              Full Timesheet
            </Button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklyAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 10]} />
                <Tooltip
                  formatter={(val) => [`${val} hrs`, 'Logged']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="logged" fill="#2563eb" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expected" fill="#e2e8f0" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Quick Actions & Recent Activity */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="enterprise-card p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider text-xs">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/leaves')}
                icon={CalendarCheck}
                className="justify-start text-xs font-semibold py-2.5"
              >
                Apply Leave
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/attendance')}
                icon={Clock}
                className="justify-start text-xs font-semibold py-2.5"
              >
                Punch History
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/payroll')}
                icon={FileText}
                className="justify-start text-xs font-semibold py-2.5"
              >
                Salary Slips
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/ai-copilot')}
                icon={Sparkles}
                className="justify-start text-xs font-semibold py-2.5 text-indigo-600 border-indigo-200 bg-indigo-50/50"
              >
                Ask Copilot
              </Button>
            </div>
          </div>

          {/* Recent Timeline Stream */}
          <div className="enterprise-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900">Recent Activity</h3>
              <button
                onClick={() => navigate('/timeline')}
                className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                Full Timeline
              </button>
            </div>

            <div className="space-y-3">
              {data.recentActivity.map((evt) => (
                <div key={evt.id} className="flex items-start gap-2.5 text-xs">
                  <span className="font-mono text-[11px] text-slate-400 mt-0.5 whitespace-nowrap">
                    {evt.time}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">{evt.title}</p>
                    <p className="text-[11px] text-slate-500">{evt.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
