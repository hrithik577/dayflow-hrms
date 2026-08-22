import React from 'react';

export const StatusBadge = ({ status }) => {
  const st = (status || '').toUpperCase();

  const styles = {
    PRESENT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    HEALTHY: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    APPROVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    ALLOWED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    
    LATE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    REVIEW: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    MEDIUM: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    
    ABSENT: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    REJECTED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    BLOCKED: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    ATTENTION: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    HIGH: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    CRITICAL: 'bg-rose-500/10 text-rose-400 border-rose-500/20',

    LEAVE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    PAID: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    SICK: 'bg-purple-500/10 text-purple-400 border-purple-500/20',

    NOT_CHECKED_IN: 'bg-slate-700/50 text-slate-400 border-slate-600/30'
  };

  const badgeClass = styles[st] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {st.replace(/_/g, ' ')}
    </span>
  );
};
