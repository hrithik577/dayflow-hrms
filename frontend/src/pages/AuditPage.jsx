import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { FileCheck2, Filter, Search, Shield, User, Clock } from 'lucide-react';

export const AuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [actionSearch, setActionSearch] = useState('');

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      let url = `/api/audit?action=${encodeURIComponent(actionSearch)}`;
      if (roleFilter) url += `&role=${roleFilter}`;
      const res = await api.get(url);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [roleFilter, actionSearch]);

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-blue-400" />
            System Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1">Immutable execution logs for security, compliance, & AI guardrail events</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={actionSearch}
              onChange={(e) => setActionSearch(e.target.value)}
              placeholder="Search action or entity..."
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-56"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
          >
            <option value="">All Roles</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="HR">HR</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">Details / Execution Log</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-sans">Loading audit logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-sans">No audit events recorded</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4 text-slate-400 font-sans text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-sans font-medium text-slate-200">{log.user_email || 'System'}</td>
                    <td className="px-6 py-4 font-sans">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        log.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        log.role === 'HR' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {log.role || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-blue-400">{log.action}</td>
                    <td className="px-6 py-4 text-slate-400">{log.entity_type ? `${log.entity_type}#${log.entity_id || ''}` : '—'}</td>
                    <td className="px-6 py-4 text-slate-300 max-w-xs truncate">
                      {log.new_value || log.old_value || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
