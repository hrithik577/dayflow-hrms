import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  ShieldAlert,
  Lock,
  Calendar,
  User,
} from 'lucide-react';
import { auditApi } from '../../services/auditApi';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

export default function AuditLogsPage() {
  const { isManagement } = useAuth();
  const { showToast } = useNotifications();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await auditApi.getLogs({
        search,
        role: selectedRole,
        action: selectedAction,
      });
      setLogs(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [search, selectedRole, selectedAction]);

  const handleExportCSV = () => {
    const headers = ['Log ID', 'User', 'Role', 'Action', 'Entity', 'IP Address', 'Status', 'Timestamp'];
    const rows = logs.map((l) => [
      l.id,
      l.user,
      l.role,
      l.action,
      `"${l.entity.replace(/"/g, '""')}"`,
      l.ipAddress,
      l.status,
      l.timestamp,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Dayflow_Audit_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Audit log export initiated.', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Compliance & Security Stream
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1 tracking-tight">
            Enterprise Security & Audit Trail
          </h1>
          <p className="text-xs text-slate-500">
            Immutable system audit logs tracking user authentications, payroll edits, leave approvals, and guardrail blocks.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportCSV}
          icon={Download}
          className="font-bold"
        >
          Export Audit Trail (CSV)
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="enterprise-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, action, entity, or IP address..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white font-medium"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="HR">HR</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
          </select>

          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white font-medium"
          >
            <option value="ALL">All Actions</option>
            <option value="LEAVE">Leave Actions</option>
            <option value="SALARY">Payroll & Salary</option>
            <option value="EMPLOYEE">Employee Record</option>
            <option value="AI_SECURITY_BLOCK">Guardrail Blocks</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="enterprise-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Log ID</th>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Action</th>
                <th className="px-6 py-3.5">Target Entity</th>
                <th className="px-6 py-3.5">IP Address</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {logs.map((log) => {
                const isBlocked = log.status === 'BLOCKED_BY_GUARDRAIL';
                return (
                  <tr key={log.id} className={`hover:bg-slate-50 transition-colors ${isBlocked ? 'bg-rose-50/30' : ''}`}>
                    <td className="px-6 py-3.5 font-mono text-[11px] font-bold text-slate-500">{log.id}</td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">{log.user}</td>
                    <td className="px-6 py-3.5">
                      <Badge
                        variant={log.role === 'ADMIN' ? 'rose' : log.role === 'HR' ? 'amber' : 'blue'}
                        size="xs"
                      >
                        {log.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-[11px] font-bold text-slate-800">{log.action}</td>
                    <td className="px-6 py-3.5 text-slate-600 max-w-xs truncate" title={log.entity}>
                      {log.entity}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-[11px] text-slate-500">{log.ipAddress}</td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isBlocked
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-[11px] text-slate-500">{log.timestamp}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
