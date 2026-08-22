import React, { useState } from 'react';
import { Calendar, Users, TrendingUp, AlertCircle, Clock } from 'lucide-react';

/**
 * 30-Day Workforce Attendance Heatmap and Department Distribution Matrix.
 * Visualizes on-site vs remote percentages, late arrivals, and attendance anomalies.
 */
export default function AttendanceHeatmapChart({ attendanceRecords = [] }) {
  const [selectedDay, setSelectedDay] = useState(null);

  // Generate 30-day grid data with deterministic realistic distributions
  const days = Array.from({ length: 30 }, (_, idx) => {
    const dayNum = idx + 1;
    const isWeekend = dayNum % 7 === 0 || dayNum % 7 === 6;
    const basePresent = isWeekend ? 0 : 85 + ((dayNum * 7) % 14);
    const late = isWeekend ? 0 : (dayNum % 5 === 0 ? 4 : 1);
    const remote = isWeekend ? 0 : Math.round(basePresent * 0.35);
    const onSite = basePresent - remote;
    const onLeave = isWeekend ? 0 : 100 - basePresent;

    let intensity = 'bg-slate-800/40 text-slate-500';
    if (!isWeekend) {
      if (basePresent >= 95) intensity = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400';
      else if (basePresent >= 88) intensity = 'bg-blue-500/20 border-blue-500/40 text-blue-400';
      else if (basePresent >= 80) intensity = 'bg-amber-500/20 border-amber-500/40 text-amber-400';
      else intensity = 'bg-rose-500/20 border-rose-500/40 text-rose-400';
    }

    return {
      day: dayNum,
      date: `Aug ${String(dayNum).padStart(2, '0')}`,
      isWeekend,
      presentRate: basePresent,
      onSite,
      remote,
      late,
      onLeave,
      intensity,
    };
  });

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            30-Day Workforce Attendance Heatmap
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Daily presence density, remote vs in-office distribution, and late arrival patterns
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500/40 border border-emerald-500/60 inline-block"></span> ≥95%
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded bg-blue-500/40 border border-blue-500/60 inline-block"></span> 88-94%
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded bg-amber-500/40 border border-amber-500/60 inline-block"></span> 80-87%
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2.5 h-2.5 rounded bg-rose-500/40 border border-rose-500/60 inline-block"></span> &lt;80%
          </span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 mb-4">
        {days.map((item) => (
          <button
            key={item.day}
            onClick={() => setSelectedDay(item)}
            className={`p-2.5 rounded-lg border text-left transition-all duration-150 relative group ${item.intensity} ${
              selectedDay?.day === item.day ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-900' : 'hover:scale-105'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-mono font-medium">
              <span>{item.date}</span>
              {item.late > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" title={`${item.late} late arrivals`} />
              )}
            </div>
            <div className="text-xs font-bold mt-1">
              {item.isWeekend ? 'OFF' : `${item.presentRate}%`}
            </div>
          </button>
        ))}
      </div>

      {/* Detail Inspector Bar */}
      {selectedDay && (
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 flex flex-wrap items-center justify-between gap-4 text-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-slate-200">Daily Telemetry for {selectedDay.date}:</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              On-Site: <strong className="text-slate-100 font-mono">{selectedDay.onSite}%</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              Remote: <strong className="text-slate-100 font-mono">{selectedDay.remote}%</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              Late Check-ins: <strong className="text-amber-400 font-mono">{selectedDay.late}</strong>
            </span>
          </div>
          <button
            onClick={() => setSelectedDay(null)}
            className="text-[11px] text-slate-400 hover:text-slate-200 underline"
          >
            Close Inspector
          </button>
        </div>
      )}
    </div>
  );
}
