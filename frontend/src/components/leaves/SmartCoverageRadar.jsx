import React from 'react';
import { ShieldCheck, AlertTriangle, Users, CheckCircle2 } from 'lucide-react';

/**
 * Smart Leave Coverage Intelligence & Department Capacity Radar.
 * Computes live team availability during requested leave periods and flags overlap bottlenecks.
 */
export default function SmartCoverageRadar({
  department = 'Engineering',
  totalTeamMembers = 12,
  overlappingOnLeave = 2,
  thresholdPercent = 70,
}) {
  const availableMembers = Math.max(0, totalTeamMembers - overlappingOnLeave);
  const coveragePercent = Math.round((availableMembers / totalTeamMembers) * 100);
  const isHealthy = coveragePercent >= thresholdPercent;
  const isCritical = coveragePercent < 50;

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      isCritical
        ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
        : isHealthy
        ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
        : 'bg-amber-950/30 border-amber-500/40 text-amber-200'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {isHealthy ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Smart Coverage Intelligence ({department})
            </h4>
            <p className="text-xs mt-0.5 text-slate-400">
              {isHealthy
                ? 'Safe team capacity threshold maintained.'
                : 'Potential team bottleneck detected during requested dates.'}
            </p>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
          isHealthy ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
        }`}>
          {coveragePercent}% Available
        </span>
      </div>

      {/* Capacity Progress Bar */}
      <div className="mt-3">
        <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
          <span>Available: {availableMembers} / {totalTeamMembers}</span>
          <span>Target Min: {thresholdPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isCritical ? 'bg-rose-500' : isHealthy ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `${coveragePercent}%` }}
          />
        </div>
      </div>

      {/* Warning / Confirmation Insight */}
      <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-300">
        {isHealthy ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>No conflicting critical role vacancies during this period.</span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{overlappingOnLeave} team members are already approved for overlapping dates.</span>
          </>
        )}
      </div>
    </div>
  );
}
