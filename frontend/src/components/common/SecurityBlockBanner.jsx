import React from 'react';
import { ShieldAlert, Lock, AlertTriangle } from 'lucide-react';
import Button from './Button';

export default function SecurityBlockBanner({
  title = 'REQUEST BLOCKED',
  message = 'Employees may only access their own personal payroll and attendance information.',
  reason = 'Permission restricted by role-based access control (RBAC).',
  securityEventId = 'SEC-2026-8841',
  timestamp,
  onDismiss,
}) {
  return (
    <div className="rounded-xl border-2 border-rose-500 bg-rose-50/90 p-6 shadow-lg animate-fade-in my-4">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-rose-600 p-3 text-white shadow-md">
          <ShieldAlert className="h-7 w-7 animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-base font-extrabold uppercase tracking-wide text-rose-900">
              🛑 {title}
            </h4>
            <span className="rounded bg-rose-200 px-2 py-0.5 text-xs font-bold text-rose-800">
              RBAC Guardrail Active
            </span>
          </div>

          <p className="mt-2 text-sm font-semibold text-rose-800">{message}</p>

          <div className="mt-3 rounded-lg border border-rose-200 bg-white/80 p-3 text-xs text-rose-900">
            <div className="flex items-center gap-2 font-medium">
              <Lock className="h-3.5 w-3.5 text-rose-600" />
              <span>
                <strong>Reason:</strong> {reason}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-slate-500">
              <span>Security event logged to central audit repository: <strong>{securityEventId}</strong></span>
              {timestamp && <span>Recorded at {timestamp}</span>}
            </div>
          </div>

          {onDismiss && (
            <div className="mt-4 flex justify-end">
              <Button size="sm" variant="danger" onClick={onDismiss}>
                Acknowledge Guardrail
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
