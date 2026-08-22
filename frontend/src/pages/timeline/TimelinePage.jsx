import React, { useState, useEffect } from 'react';
import {
  History,
  Clock,
  Calendar,
  CheckCircle,
  AlertTriangle,
  User,
  Shield,
  Sparkles,
  CreditCard,
  Building,
} from 'lucide-react';
import { localDB } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/common/Badge';

export default function TimelinePage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const db = localDB.get();
    setEvents(db.timeline);
  }, []);

  const getEventIcon = (type) => {
    switch (type) {
      case 'ATTENDANCE':
        return <Clock className="w-4 h-4 text-emerald-600" />;
      case 'LEAVE':
        return <Calendar className="w-4 h-4 text-purple-600" />;
      case 'AI':
        return <Sparkles className="w-4 h-4 text-indigo-600" />;
      case 'PAYROLL':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      default:
        return <History className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <History className="w-3.5 h-3.5 text-blue-600" /> Workday Event Stream
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
          Workday & Organization Timeline
        </h1>
        <p className="text-xs text-slate-500">
          Chronological journal of punches, leave approvals, AI observations, and operational milestones.
        </p>
      </div>

      {/* Timeline Stream */}
      <div className="enterprise-card p-6">
        <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-8">
          {events.map((evt, idx) => (
            <div key={evt.id || idx} className="relative group">
              {/* Dot Icon Indicator */}
              <div className="absolute -left-[35px] sm:-left-[43px] top-0 p-1.5 rounded-full bg-white border-2 border-blue-500 shadow-sm flex items-center justify-center">
                {getEventIcon(evt.type)}
              </div>

              {/* Event Content Card */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 group-hover:bg-white group-hover:border-blue-300 transition-all shadow-xs space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{evt.title}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        evt.color === 'emerald'
                          ? 'bg-emerald-100 text-emerald-800'
                          : evt.color === 'amber'
                          ? 'bg-amber-100 text-amber-800'
                          : evt.color === 'purple'
                          ? 'bg-purple-100 text-purple-800'
                          : evt.color === 'rose'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {evt.badge}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-slate-500 font-bold">{evt.time}</span>
                </div>

                <p className="text-xs text-slate-600">{evt.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
