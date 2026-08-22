import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { BrainCircuit, ShieldAlert, CheckCircle2, FileText, AlertCircle } from 'lucide-react';

export const AIInsightsPage = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    try {
      const res = await api.get('/api/ai/insights');
      setInsights(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-purple-400" />
          AI Attention Signals & Insights
        </h1>
        <p className="text-xs text-slate-400 mt-1">Explainable workforce intelligence, neutral evidence summaries, & recommendations</p>
      </div>

      {/* Insights Stream */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading AI insights stream...</div>
        ) : insights.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center text-xs text-slate-500 border border-slate-800">
            No active workforce attention signals detected. All metrics are normal.
          </div>
        ) : (
          insights.map((sig) => (
            <div key={sig.id} className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{sig.title}</h3>
                    <p className="text-xs text-slate-400">
                      Target: {sig.employee_name || 'Department'} • Department: {sig.department_name || 'General'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={sig.severity} />
                  <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full font-mono border border-slate-700">
                    Confidence: {(sig.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                  <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] block">
                    Evidence & Detection
                  </span>
                  <p className="text-slate-300 leading-relaxed">{sig.evidence}</p>
                </div>

                <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/20 space-y-1.5">
                  <span className="font-semibold text-blue-400 uppercase tracking-wider text-[11px] block">
                    Recommended Action
                  </span>
                  <p className="text-slate-200 leading-relaxed">{sig.recommendation}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500">
                <span>Detected on: {new Date(sig.created_at).toLocaleString()}</span>
                <span>Human Approval: Required for execution</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
