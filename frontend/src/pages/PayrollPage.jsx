import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { DollarSign, Edit, Shield, CheckCircle } from 'lucide-react';

export const PayrollPage = () => {
  const [payrollData, setPayrollData] = useState([]);
  const [myPayroll, setMyPayroll] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPay, setSelectedPay] = useState(null);
  const [editBasic, setEditBasic] = useState(0);
  const [editAllowances, setEditAllowances] = useState(0);
  const [editDeductions, setEditDeductions] = useState(0);
  const [saveLoading, setSaveLoading] = useState(false);

  const { isRole } = useAuth();
  const isHR = isRole('HR', 'ADMIN');

  const fetchPayroll = async () => {
    setLoading(true);
    try {
      if (isHR) {
        const res = await api.get('/api/payroll');
        setPayrollData(res.data);
      } else {
        const res = await api.get('/api/payroll/me');
        setMyPayroll(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, []);

  const openEditModal = (pay) => {
    setSelectedPay(pay);
    setEditBasic(pay.basic_salary);
    setEditAllowances(pay.allowances);
    setEditDeductions(pay.deductions);
    setEditModalOpen(true);
  };

  const handleUpdatePayroll = async (e) => {
    e.preventDefault();
    if (!selectedPay) return;
    setSaveLoading(true);

    try {
      await api.patch(`/api/payroll/${selectedPay.id}`, {
        basic_salary: parseFloat(editBasic),
        allowances: parseFloat(editAllowances),
        deductions: parseFloat(editDeductions)
      });
      setEditModalOpen(false);
      fetchPayroll();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update payroll structure');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-emerald-400" />
          {isHR ? 'Company Payroll Management' : 'My Salary & Compensation'}
        </h1>
        <p className="text-xs text-slate-400 mt-1">Salary structures, allowances, deductions, and net payouts</p>
      </div>

      {!isHR && myPayroll && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-extrabold text-slate-100">{myPayroll.employee_name}</h2>
              <p className="text-xs text-slate-400">{myPayroll.designation} • {myPayroll.department_name}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 uppercase font-semibold">Net Salary Payout</span>
              <h3 className="text-3xl font-black text-emerald-400 mt-0.5">
                ${myPayroll.net_salary.toLocaleString()} <span className="text-xs font-normal text-slate-400">USD/mo</span>
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-xs font-semibold text-slate-400 uppercase">Basic Salary</p>
              <h4 className="text-xl font-bold text-slate-200 mt-1">${myPayroll.basic_salary.toLocaleString()}</h4>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-xs font-semibold text-emerald-400 uppercase">Allowances</p>
              <h4 className="text-xl font-bold text-emerald-300 mt-1">+${myPayroll.allowances.toLocaleString()}</h4>
            </div>
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-xs font-semibold text-rose-400 uppercase">Deductions</p>
              <h4 className="text-xl font-bold text-rose-300 mt-1">-${myPayroll.deductions.toLocaleString()}</h4>
            </div>
          </div>
        </div>
      )}

      {isHR && (
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Workforce Payroll Directory</span>
            <span className="text-xs text-slate-400">Restricted HR & Admin View</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Basic Salary</th>
                  <th className="px-6 py-4">Allowances</th>
                  <th className="px-6 py-4">Deductions</th>
                  <th className="px-6 py-4">Net Salary</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading payroll records...</td>
                  </tr>
                ) : (
                  payrollData.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-100">{p.employee_name}</p>
                          <p className="text-[11px] text-slate-500">{p.designation}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">{p.department_name}</td>
                      <td className="px-6 py-4 font-mono">${p.basic_salary.toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono text-emerald-400">+${p.allowances.toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono text-rose-400">-${p.deductions.toLocaleString()}</td>
                      <td className="px-6 py-4 font-mono font-bold text-slate-100">${p.net_salary.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEditModal(p)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors inline-flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit Salary
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Payroll Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Update Salary Structure: ${selectedPay?.employee_name}`}>
        <form onSubmit={handleUpdatePayroll} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold uppercase">Basic Salary (USD)</label>
            <input
              type="number"
              step="0.01"
              required
              value={editBasic}
              onChange={(e) => setEditBasic(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold uppercase">Allowances (USD)</label>
            <input
              type="number"
              step="0.01"
              required
              value={editAllowances}
              onChange={(e) => setEditAllowances(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold uppercase">Deductions (USD)</label>
            <input
              type="number"
              step="0.01"
              required
              value={editDeductions}
              onChange={(e) => setEditDeductions(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-400">Calculated Net Salary:</span>
            <span className="text-emerald-400 font-bold text-sm">
              ${(parseFloat(editBasic || 0) + parseFloat(editAllowances || 0) - parseFloat(editDeductions || 0)).toLocaleString()} USD
            </span>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveLoading}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 disabled:opacity-50"
            >
              {saveLoading ? 'Updating...' : 'Save Payroll Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
