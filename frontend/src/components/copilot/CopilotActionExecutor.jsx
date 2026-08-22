import React, { useState } from 'react';
import { Play, Check, Clock, AlertCircle, Send, CheckCircle2 } from 'lucide-react';

/**
 * Interactive Copilot Action Execution Widget.
 * Empowers HR and Admin users to review, confirm, and dispatch AI-recommended actions.
 */
export default function CopilotActionExecutor({
  actionTitle = 'Schedule 1-on-1 Check-in',
  targetEmployee = 'Alex Morgan',
  reason = '3 consecutive late check-ins detected this week',
  onExecute = () => {},
}) {
  const [status, setStatus] = useState('idle'); // 'idle' | 'executing' | 'completed'

  const handleRun = () => {
    setStatus('executing');
    setTimeout(() => {
      setStatus('completed');
      onExecute({ actionTitle, targetEmployee, executedAt: new Date().toISOString() });
    }, 800);
  };

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-400">
            Suggested AI Action
          </span>
          <h4 className="text-xs font-semibold text-slate-100 mt-0.5">{actionTitle}</h4>
          <p className="text-xs text-slate-400 mt-1">
            Target: <strong className="text-slate-200">{targetEmployee}</strong> • {reason}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-800/80 text-xs">
        {status === 'completed' ? (
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium text-xs animate-fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Action successfully dispatched to notification bus</span>
          </div>
        ) : (
          <>
            <span className="text-[11px] text-slate-400">Requires HR Confirmation</span>
            <button
              onClick={handleRun}
              disabled={status === 'executing'}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                status === 'executing'
                  ? 'bg-blue-600/50 text-white cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              }`}
            >
              {status === 'executing' ? (
                <>
                  <Clock className="w-3.5 h-3.5 animate-spin" /> Dispatching...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Execute Action
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
