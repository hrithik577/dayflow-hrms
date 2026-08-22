import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { CalendarDays, Plus, CheckCircle, XCircle, BrainCircuit, AlertTriangle, ShieldCheck } from 'lucide-react';

export const LeavePage = () => {
  const [data, setData] = useState({ balances: [], requests: [] });
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // HR Review Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);
  const [reviewerComment, setReviewerComment] = useState('');

  const { isRole } = useAuth();
  const isHR = isRole('HR', 'ADMIN');

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      if (isHR) {
        const res = await api.get('/api/leaves');
        setData({ balances: [], requests: res.data });
      } else {
        const res = await api.get('/api/leaves/me');
        setData(res.data);
      }
      const tRes = await api.get('/api/leaves/types');
      setLeaveTypes(tRes.data);
      if (tRes.data.length > 0) setLeaveTypeId(tRes.data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) return;
    setSubmitLoading(true);

    try {
      await api.post('/api/leaves', {
        leave_type_id: parseInt(leaveTypeId),
        start_date: startDate,
        end_date: endDate,
        reason
      });
      setCreateModalOpen(false);
      setReason('');
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to submit leave request');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedReq) return;
    try {
      await api.post(`/api/leaves/${selectedReq.id}/approve`, { reviewer_comment: reviewerComment });
      setReviewModalOpen(false);
      setReviewerComment('');
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.detail || 'Approval failed');
    }
  };

  const handleReject = async () => {
    if (!selectedReq || !reviewerComment) {
      alert('Please provide a rejection comment');
      return;
    }
    try {
      await api.post(`/api/leaves/${selectedReq.id}/reject`, { reviewer_comment: reviewerComment });
      setReviewModalOpen(false);
      setReviewerComment('');
      fetchLeaves();
    } catch (err) {
      alert(err.response?.data?.detail || 'Rejection failed');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-purple-400" />
            {isHR ? 'Leave Pipeline & Management' : 'My Leave Management'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">Smart coverage intelligence & leave request tracking</p>
        </div>

        {!isHR && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-blue-600/30"
          >
            <Plus className="w-4 h-4" />
            Apply for Leave
          </button>
        )}
      </div>

      {/* Leave Balances Header Strip (for Employees) */}
      {!isHR && data.balances.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.balances.map((b) => (
            <div key={b.id} className="glass-card rounded-xl p-4 border border-slate-800">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{b.leave_type_name}</p>
              <h3 className="text-xl font-bold text-slate-100 mt-1">{b.remaining_days} <span className="text-xs text-slate-400 font-normal">days left</span></h3>
              <p className="text-[11px] text-slate-500 mt-1">Allocated: {b.allocated_days} • Used: {b.used_days}</p>
            </div>
          ))}
        </div>
      )}

      {/* Leave Requests Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Leave Requests</span>
          <span className="text-xs text-slate-400">Total: {data.requests.length}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Leave Type</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4">Total Days</th>
                <th className="px-6 py-4">Smart AI Assessment</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading leave requests...</td>
                </tr>
              ) : data.requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">No leave requests found</td>
                </tr>
              ) : (
                data.requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-100">{r.employee_name || 'Me'}</p>
                        <p className="text-[11px] text-slate-500">{r.department_name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-200">{r.leave_type_name}</td>
                    <td className="px-6 py-4 font-mono">{r.start_date} to {r.end_date}</td>
                    <td className="px-6 py-4 font-semibold text-blue-400">{r.total_days} days</td>
                    <td className="px-6 py-4">
                      {r.ai_coverage_assessment ? (
                        <div className="text-[11px] space-y-0.5">
                          <span className="font-semibold text-slate-200 flex items-center gap-1">
                            <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
                            {r.ai_coverage_assessment.estimated_team_availability_pct}% Team Available
                          </span>
                          <p className="text-slate-400 text-[10px]">{r.ai_coverage_assessment.summary}</p>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px]">Normal Coverage</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isHR && r.status === 'PENDING' ? (
                        <button
                          onClick={() => {
                            setSelectedReq(r);
                            setReviewerComment('');
                            setReviewModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors"
                        >
                          Review Request
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          {r.reviewer_comment ? `"${r.reviewer_comment}"` : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Apply for Leave">
        <form onSubmit={handleApply} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold uppercase">Leave Type</label>
            <select
              value={leaveTypeId}
              onChange={(e) => setLeaveTypeId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
            >
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name} (Limit: {t.annual_limit} days)</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold uppercase">Start Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold uppercase">End Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold uppercase">Reason</label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the reason for leave..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 disabled:opacity-50"
            >
              {submitLoading ? 'Submitting...' : 'Submit Leave Request'}
            </button>
          </div>
        </form>
      </Modal>

      {/* HR Review Modal */}
      <Modal isOpen={reviewModalOpen} onClose={() => setReviewModalOpen(false)} title={`Review Leave: ${selectedReq?.employee_name}`}>
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
            <p><strong className="text-slate-300">Dates:</strong> {selectedReq?.start_date} to {selectedReq?.end_date} ({selectedReq?.total_days} days)</p>
            <p><strong className="text-slate-300">Reason:</strong> "{selectedReq?.reason}"</p>
          </div>

          {selectedReq?.ai_coverage_assessment && (
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-200 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <BrainCircuit className="w-4 h-4 text-purple-400" />
                Smart Leave Coverage Assessment
              </span>
              <p>{selectedReq.ai_coverage_assessment.summary}</p>
              <p className="text-[11px] text-purple-300">Risk Level: <strong>{selectedReq.ai_coverage_assessment.risk_level}</strong></p>
            </div>
          )}

          <div>
            <label className="block text-slate-400 mb-1 font-semibold uppercase">HR Reviewer Comment</label>
            <textarea
              rows={3}
              value={reviewerComment}
              onChange={(e) => setReviewerComment(e.target.value)}
              placeholder="Add approval or rejection remarks..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              onClick={handleReject}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" /> Reject Request
            </button>
            <button
              onClick={handleApprove}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" /> Approve Request
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
