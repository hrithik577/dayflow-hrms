import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { useSocket } from '../context/SocketContext';
import { Users, UserCheck, UserX, Calendar, Clock, Activity, BrainCircuit, Zap, ShieldAlert } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { lastEvent } = useSocket();

  const fetchAdminDashboard = async () => {
    try {
      const res = await api.get('/api/dashboard/admin');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminDashboard();
  }, []);

  // Auto refresh on live WebSocket event!
  useEffect(() => {
    if (lastEvent) {
      fetchAdminDashboard();
    }
  }, [lastEvent]);

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <div key={i} className="h-28 bg-slate-800 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const deptHealth = data?.department_health || [];
  const aiSignals = data?.ai_attention_signals || [];
  const trendData = data?.attendance_trend || [];
  const liveFeed = data?.live_activity_feed || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Command Center
            <span className="text-xs bg-emerald-500/10 text-emerald-400 font-semibold px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Live WebSocket Stream
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Real-time workforce metrics, attendance analytics, & AI attention signals</p>
        </div>
      </div>

      {/* Metric Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Staff" value={metrics.total_employees} icon={Users} color="blue" />
        <StatCard title="Present Today" value={metrics.present_today} subtitle={`${metrics.attendance_rate}% Rate`} icon={UserCheck} color="emerald" />
        <StatCard title="Absent Today" value={metrics.absent_today} icon={UserX} color="rose" />
        <StatCard title="On Leave" value={metrics.on_leave_today} subtitle={`${metrics.pending_leaves_count} Pending`} icon={Calendar} color="purple" />
        <StatCard title="Late Check-ins" value={metrics.late_today} icon={Clock} color="amber" />
      </div>

      {/* Attendance Trend Chart & Department Health Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Chart */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            7-Day Company Attendance Trend (%)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="attendance_rate" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRate)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Health */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Department Health Breakdown
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {deptHealth.map((d, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-200">{d.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {d.present}/{d.headcount} present • {d.late} late
                  </p>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Attention Signals & Live Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Attention Signals */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-purple-400" />
            AI Workforce Attention Signals
          </h3>
          <div className="space-y-3">
            {aiSignals.length === 0 ? (
              <p className="text-xs text-slate-500">No active workforce attention signals detected.</p>
            ) : (
              aiSignals.map((sig) => (
                <div key={sig.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      {sig.title}
                    </span>
                    <StatusBadge status={sig.severity} />
                  </div>
                  <p className="text-xs text-slate-300">{sig.explanation}</p>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                    <p><strong className="text-slate-300">Evidence:</strong> {sig.evidence}</p>
                    <p><strong className="text-blue-400">Recommendation:</strong> {sig.recommendation}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Live System Activity Feed
          </h3>
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {liveFeed.map((item) => (
              <div key={item.id} className="p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs space-y-0.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-semibold text-blue-400">{item.user} ({item.role})</span>
                  <span className="text-slate-500">{item.time}</span>
                </div>
                <p className="text-slate-300 font-mono text-[11px]">{item.action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
