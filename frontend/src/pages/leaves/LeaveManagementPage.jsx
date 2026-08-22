import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CalendarPlus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Filter,
  User,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { leaveApi } from '../../services/leaveApi';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { LEAVE_TYPES, LEAVE_STATUS, DEPARTMENTS } from '../../utils/constants';
import { calculateDaysBetween } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';

export default function LeaveManagementPage() {
  const { user, isManagement, isAdmin } = useAuth();
  const { showToast } = useNotifications();

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  const [selectedDept, setSelectedDept] = useState('All Departments');

  // Apply Leave Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyData, setApplyData] = useState({
    leaveType: 'PAID',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [applyLoading, setApplyLoading] = useState(false);

  // Review / Comment State
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [hrComment, setHrComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const params = {
        status: activeTab,
        department: selectedDept,
        ...(isManagement ? {} : { employeeId: user.id }),
      };
      const res = await leaveApi.getLeaves(params);
      setLeaves(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, [activeTab, selectedDept, user.id, isManagement]);

  const daysCalculated = calculateDaysBetween(applyData.startDate, applyData.endDate);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    if (!applyData.startDate || !applyData.endDate) {
      showToast('Please select valid start and end dates.', 'error');
      return;
    }

    try {
      setApplyLoading(true);
      await leaveApi.applyLeave({
        employeeId: user.id,
        leaveType: applyData.leaveType,
        startDate: applyData.startDate,
        endDate: applyData.endDate,
        daysCount: daysCalculated,
        reason: applyData.reason,
      });

      showToast('Leave request submitted to HR for approval!', 'success');
      setShowApplyModal(false);
      setApplyData({ leaveType: 'PAID', startDate: '', endDate: '', reason: '' });
      loadLeaves();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleApprove = async (leaveId) => {
    try {
      setActionLoading(true);
      await leaveApi.approveLeave(leaveId, user.name, hrComment || 'Approved by HR manager');
      showToast('Leave request approved.', 'success');
      setSelectedLeave(null);
      setHrComment('');
      loadLeaves();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (leaveId) => {
    try {
      setActionLoading(true);
      await leaveApi.rejectLeave(leaveId, user.name, hrComment || 'Declined due to team capacity constraints');
      showToast('Leave request rejected.', 'info');
      setSelectedLeave(null);
      setHrComment('');
      loadLeaves();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Leave & Time-Off Management</h1>
          <p className="text-xs text-slate-500">
            Apply for time off, review leave balances, and manage team coverage approval workflows.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowApplyModal(true)}
          icon={CalendarPlus}
          className="font-bold"
        >
          Apply for Leave
        </Button>
      </div>

      {/* Leave Quota Balances (For Current Employee) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(user?.leaveBalances || {}).map(([key, val]) => (
          <div key={key} className="enterprise-card p-4">
            <span className="text-[11px] font-bold uppercase text-slate-500">{key.replace('_', ' ')}</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 tabular-nums">{val.remaining}</span>
              <span className="text-xs text-slate-500 font-medium">/ {val.total} days</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-400">{val.used} days used this year</div>
          </div>
        ))}
      </div>

      {/* Filters and Tabs */}
      <div className="enterprise-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === tab ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'ALL' ? 'All Requests' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Department Filter (For HR/Admin) */}
        {isManagement && (
          <div className="w-52">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full py-1.5 px-3 text-xs border border-slate-300 rounded-lg bg-white font-medium"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Leave Requests Table */}
      <div className="enterprise-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Employee</th>
                <th className="px-6 py-3.5">Leave Type</th>
                <th className="px-6 py-3.5">Dates</th>
                <th className="px-6 py-3.5">Duration</th>
                <th className="px-6 py-3.5">Reason</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No leave requests found for the selected filter.
                  </td>
                </tr>
              ) : (
                leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{l.employeeName}</div>
                      <div className="text-[11px] text-slate-500">{l.department}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-blue-700">{l.leaveType}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-800">
                      {l.startDate} → {l.endDate}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{l.daysCount} day(s)</td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-600" title={l.reason}>
                      {l.reason}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          l.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : l.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isManagement && l.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="xs"
                            variant="success"
                            onClick={() => {
                              setSelectedLeave(l);
                              handleApprove(l.id);
                            }}
                            icon={Check}
                          >
                            Approve
                          </Button>
                          <Button
                            size="xs"
                            variant="danger"
                            onClick={() => {
                              setSelectedLeave(l);
                              handleReject(l.id);
                            }}
                            icon={X}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {l.reviewedBy ? `Reviewed by ${l.reviewedBy}` : 'Submitted'}
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
      {showApplyModal && (
        <Modal
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          title="Apply for Leave / Time-Off"
          subtitle="Submit request for manager & HR review"
        >
          <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700">Leave Type</label>
              <select
                value={applyData.leaveType}
                onChange={(e) => setApplyData({ ...applyData, leaveType: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                {Object.keys(LEAVE_TYPES).map((type) => (
                  <option key={type} value={type}>
                    {LEAVE_TYPES[type].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700">Start Date</label>
                <input
                  type="date"
                  required
                  value={applyData.startDate}
                  onChange={(e) => setApplyData({ ...applyData, startDate: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700">End Date</label>
                <input
                  type="date"
                  required
                  value={applyData.endDate}
                  onChange={(e) => setApplyData({ ...applyData, endDate: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {applyData.startDate && applyData.endDate && (
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-medium">
                Total duration requested: <strong>{daysCalculated} day(s)</strong>
              </div>
            )}

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700">Reason / Remarks</label>
              <textarea
                rows={3}
                required
                value={applyData.reason}
                onChange={(e) => setApplyData({ ...applyData, reason: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="Please describe the reason for your time-off request..."
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowApplyModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={applyLoading}>
                Submit Request
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
