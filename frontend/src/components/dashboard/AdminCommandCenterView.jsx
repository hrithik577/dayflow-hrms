import React, { useState, useEffect } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarCheck,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Activity,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  ExternalLink,
  Building,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { dashboardApi } from '../../services/dashboardApi';
import { leaveApi } from '../../services/leaveApi';
import { useNotifications } from '../../context/NotificationContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { useNavigate } from 'react-router-dom';

export default function AdminCommandCenterView() {
  const { showToast } = useNotifications();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getAdminCommandCenter();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveLeave = async (leaveId) => {
    try {
      setApprovingId(leaveId);
      await leaveApi.approveLeave(leaveId, 'Sarah Connor (Admin)', 'Approved via Executive Command Center');
      showToast('Leave request approved instantly.', 'success');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectLeave = async (leaveId) => {
    try {
      setApprovingId(leaveId);
      await leaveApi.rejectLeave(leaveId, 'Sarah Connor (Admin)', 'Declined due to critical staffing overlap.');
      showToast('Leave request declined.', 'info');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setApprovingId(null);
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-slate-200 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const { kpis, attendanceTrend, departmentHealth, pendingLeaves, insights, recentActivity } = data;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" /> Live Telemetry
            </span>
            <span className="text-xs text-slate-500 font-medium">Updated 30s ago</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
            Workforce Intelligence & Command Center
          </h1>
          <p className="text-xs text-slate-500">
            Real-time organizational health, attendance analytics, AI telemetry, and approval workflows.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/ai-insights')}
            icon={Sparkles}
            className="text-indigo-600 border-indigo-200 bg-indigo-50/50"
          >
            AI Insights ({kpis.aiSignalsCount})
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/ai-copilot')}
            icon={Sparkles}
          >
            Workforce Copilot
          </Button>
        </div>
      </div>

      {/* 8-Metric Enterprise Command Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total Employees */}
        <div className="enterprise-card p-4 text-center sm:text-left">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Headcount</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">{kpis.totalEmployees}</p>
          <p className="text-[10px] text-slate-500 mt-1">Active Staff</p>
        </div>

        {/* Present Today */}
        <div className="enterprise-card p-4 text-center sm:text-left border-emerald-200 bg-emerald-50/20">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Present</p>
          <p className="text-2xl font-extrabold text-emerald-800 mt-1 tabular-nums">{kpis.presentCount}</p>
          <p className="text-[10px] text-emerald-600 mt-1">Clocked In</p>
        </div>

        {/* Absent */}
        <div className="enterprise-card p-4 text-center sm:text-left border-rose-200 bg-rose-50/20">
          <p className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Absent</p>
          <p className="text-2xl font-extrabold text-rose-800 mt-1 tabular-nums">{kpis.absentCount}</p>
          <p className="text-[10px] text-rose-600 mt-1">Unlogged</p>
        </div>

        {/* On Leave */}
        <div className="enterprise-card p-4 text-center sm:text-left border-blue-200 bg-blue-50/20">
          <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700">On Leave</p>
          <p className="text-2xl font-extrabold text-blue-800 mt-1 tabular-nums">{kpis.onLeaveCount}</p>
          <p className="text-[10px] text-blue-600 mt-1">Approved PTO</p>
        </div>

        {/* Late Arrivals */}
        <div className="enterprise-card p-4 text-center sm:text-left border-amber-200 bg-amber-50/20">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Late</p>
          <p className="text-2xl font-extrabold text-amber-800 mt-1 tabular-nums">{kpis.lateCount}</p>
          <p className="text-[10px] text-amber-600 mt-1">&gt;9:10 AM</p>
        </div>

        {/* Attendance Rate */}
        <div className="enterprise-card p-4 text-center sm:text-left border-indigo-200 bg-indigo-50/20">
          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Presence %</p>
          <p className="text-2xl font-extrabold text-indigo-800 mt-1 tabular-nums">{kpis.attendanceRate}%</p>
          <p className="text-[10px] text-indigo-600 mt-1">Target: 90%</p>
        </div>

        {/* Pending Leave */}
        <div className="enterprise-card p-4 text-center sm:text-left">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Pending PTO</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">{kpis.pendingLeavesCount}</p>
          <p className="text-[10px] text-amber-600 font-semibold mt-1">Requires HR</p>
        </div>

        {/* AI Attention Signals */}
        <div className="enterprise-card p-4 text-center sm:text-left border-purple-200 bg-purple-50/20">
          <p className="text-[11px] font-bold uppercase tracking-wider text-purple-700">AI Signals</p>
          <p className="text-2xl font-extrabold text-purple-800 mt-1 tabular-nums">{kpis.aiSignalsCount}</p>
          <p className="text-[10px] text-purple-600 font-semibold mt-1">Anomalies</p>
        </div>
      </div>

      {/* Main Grid: Attendance Trend & Department Health Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Chart (2 Cols) */}
        <div className="lg:col-span-2 enterprise-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Attendance & Punctuality Trend</h3>
              <p className="text-xs text-slate-500">14-day rolling organization presence percentage</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-blue-600 font-semibold">
                <span className="h-2 w-2 rounded-full bg-blue-600" /> Attendance %
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={attendanceTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis domain={[80, 100]} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  formatter={(val) => [`${val}%`, 'Presence Rate']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="rate" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Health Matrix (1 Col) */}
        <div className="enterprise-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Department Health</h3>
              <p className="text-xs text-slate-500">Staffing & velocity matrix</p>
            </div>
            <Building className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3">
            {departmentHealth.map((dept) => (
              <div
                key={dept.name}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{dept.name}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      dept.healthColor === 'emerald'
                        ? 'bg-emerald-100 text-emerald-800'
                        : dept.healthColor === 'amber'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {dept.health}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Headcount: <strong>{dept.headcount}</strong></span>
                  <span>Present: <strong className="text-emerald-700">{dept.present}</strong></span>
                  {dept.late > 0 && <span className="text-amber-600">Late: {dept.late}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leave Approval Pipeline & AI Attention Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Leave Pipeline with Clash Detection */}
        <div className="enterprise-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Leave Approval Pipeline</h3>
              <p className="text-xs text-slate-500">Review pending employee time-off requests</p>
            </div>
            <button
              onClick={() => navigate('/leaves')}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
            >
              All Leaves <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingLeaves.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No pending leave requests.</p>
          ) : (
            <div className="space-y-3">
              {pendingLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{leave.employeeName}</span>
                        <Badge variant="blue" size="xs">
                          {leave.department}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        <strong>{leave.leaveType}</strong> • {leave.startDate} to {leave.endDate} ({leave.daysCount} days)
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="xs"
                        variant="success"
                        loading={approvingId === leave.id}
                        onClick={() => handleApproveLeave(leave.id)}
                        icon={Check}
                      >
                        Approve
                      </Button>
                      <Button
                        size="xs"
                        variant="danger"
                        loading={approvingId === leave.id}
                        onClick={() => handleRejectLeave(leave.id)}
                        icon={X}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                    "{leave.reason}"
                  </p>

                  {/* AI Coverage Clash Indicator */}
                  {leave.aiClashWarning && (
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>{leave.aiClashWarning.coverageRatio}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Workforce Attention Signals */}
        <div className="enterprise-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">AI Workforce Attention Signals</h3>
              <p className="text-xs text-slate-500">Autonomous anomaly detection & proactive interventions</p>
            </div>
            <button
              onClick={() => navigate('/ai-insights')}
              className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer flex items-center gap-1"
            >
              Intelligence Hub <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {insights.slice(0, 2).map((ins) => (
              <div
                key={ins.id}
                className={`p-4 rounded-xl border ${
                  ins.severity === 'ATTENTION'
                    ? 'border-rose-200 bg-rose-50/40'
                    : 'border-amber-200 bg-amber-50/40'
                } space-y-2`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      ins.severity === 'ATTENTION'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {ins.severity} • {ins.confidence}% Confidence
                  </span>
                  <span className="text-[10px] text-slate-500">{ins.timestamp}</span>
                </div>

                <h4 className="text-xs font-bold text-slate-900">{ins.title}</h4>
                <p className="text-xs text-slate-600">{ins.whatHappened}</p>

                <div className="pt-2 flex items-center justify-between border-t border-slate-200/60">
                  <span className="text-[11px] font-medium text-slate-500">
                    Action: <strong>{ins.actionLabel}</strong>
                  </span>
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => navigate('/ai-insights')}
                    className="text-xs"
                  >
                    Review Evidence
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
