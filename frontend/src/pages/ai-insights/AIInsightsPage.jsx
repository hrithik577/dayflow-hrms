import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  Check,
  X,
  ArrowRight,
  RefreshCw,
  Sliders,
  FileCheck,
} from 'lucide-react';
import { aiApi } from '../../services/aiApi';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export default function AIInsightsPage() {
  const { isManagement } = useAuth();
  const { showToast } = useNotifications();

  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState('ALL'); // 'ALL' | 'ATTENTION' | 'REVIEW' | 'HEALTHY'

  const loadInsights = async () => {
    try {
      setLoading(true);
      const res = await aiApi.getInsights();
      setInsights(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  const handleApproveAction = async (id) => {
    try {
      await aiApi.approveInsightAction(id);
      showToast('Action approved and logged to HR execution pipeline.', 'success');
      loadInsights();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleDismiss = async (id) => {
    try {
      await aiApi.dismissInsight(id);
      showToast('Insight dismissed.', 'info');
      loadInsights();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const filtered = insights.filter((i) =>
    filterSeverity === 'ALL' ? true : i.severity === filterSeverity
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" /> AI Workforce Intelligence
            </span>
            <span className="text-xs text-slate-500 font-medium">Autonomous Observation Loop</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
            Workforce AI Insights & Attention Signals
          </h1>
          <p className="text-xs text-slate-500">
            Explainable telemetry insights, anomaly detection, burnout risks, and proactive recommendations.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={loadInsights}
          icon={RefreshCw}
          loading={loading}
          className="font-bold"
        >
          Refresh Telemetry
        </Button>
      </div>

      {/* Severity Filter Tabs */}
      <div className="enterprise-card p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold">
          {['ALL', 'ATTENTION', 'REVIEW', 'HEALTHY'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterSeverity(s)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                filterSeverity === s
                  ? 'bg-slate-900 text-white font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {s === 'ALL' ? 'All Signals' : s}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing <strong>{filtered.length}</strong> active insight cards
        </span>
      </div>

      {/* Structured Insight Cards List */}
      <div className="space-y-4">
        {filtered.map((item) => {
          const isAttention = item.severity === 'ATTENTION';
          const isReview = item.severity === 'REVIEW';
          const isApproved = item.approvalState === 'APPROVED';

          return (
            <div
              key={item.id}
              className={`enterprise-card p-6 rounded-2xl border-2 transition-all space-y-4 ${
                isAttention
                  ? 'border-rose-200 bg-rose-50/20 hover:border-rose-300'
                  : isReview
                  ? 'border-amber-200 bg-amber-50/20 hover:border-amber-300'
                  : 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300'
              }`}
            >
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                      isAttention
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : isReview
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    }`}
                  >
                    {item.severity}
                  </span>
                  <span className="text-xs font-bold text-slate-700 font-mono">
                    Model Confidence: {item.confidence}%
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{item.timestamp}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      isApproved
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isApproved ? 'Action Executed' : 'Awaiting HR Action'}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-base font-extrabold text-slate-900">{item.title}</h3>

              {/* Structured 4-Part Diagnostic Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* 1. What Happened */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    What Happened
                  </span>
                  <p className="font-semibold text-slate-800">{item.whatHappened}</p>
                </div>

                {/* 2. Evidence */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Observed Evidence
                  </span>
                  <p className="text-slate-700 font-mono text-[11px]">{item.evidence}</p>
                </div>

                {/* 3. Why It Matters */}
                <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Why It Matters
                  </span>
                  <p className="text-slate-700">{item.whyItMatters}</p>
                </div>

                {/* 4. Recommendation */}
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1 text-blue-950">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                    Autonomous Recommendation
                  </span>
                  <p className="font-bold">{item.recommendation}</p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Target Intervention: <strong>{item.actionLabel}</strong>
                </span>

                {isManagement && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDismiss(item.id)}
                      icon={X}
                      className="text-xs text-slate-500"
                    >
                      Dismiss
                    </Button>
                    {!isApproved && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleApproveAction(item.id)}
                        icon={Check}
                        className="text-xs font-bold"
                      >
                        Approve & Execute Action
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
