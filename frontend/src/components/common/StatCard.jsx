import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = 'bg-blue-50 text-blue-600',
  trend,
  trendPositive = true,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`enterprise-card p-5 ${onClick ? 'cursor-pointer hover:border-blue-300' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{value}</h3>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`font-semibold px-1.5 py-0.5 rounded ${
                trendPositive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              {trend}
            </span>
          )}
          {subtitle && <span className="text-slate-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
