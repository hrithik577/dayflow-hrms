import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Download,
  Building,
  DollarSign,
  FileText,
  ShieldAlert,
  Edit2,
  CheckCircle,
  TrendingUp,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { payrollApi } from '../../services/payrollApi';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';

export default function PayrollPage() {
  const { user, isManagement, isAdmin } = useAuth();
  const { showToast } = useNotifications();

  const [companyPayroll, setCompanyPayroll] = useState(null);
  const [myPayroll, setMyPayroll] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pay Slip Modal
  const [selectedSlip, setSelectedSlip] = useState(null);

  // Edit Salary Modal (Admin)
  const [editEmployee, setEditEmployee] = useState(null);
  const [salaryForm, setSalaryForm] = useState({
    basic: 8000,
    hra: 2400,
    allowances: 1200,
    effectiveDate: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const myRes = await payrollApi.getMyPayroll(user.id);
      setMyPayroll(myRes);

      if (isManagement) {
        const compRes = await payrollApi.getCompanyPayroll();
        setCompanyPayroll(compRes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id, isManagement]);

  const handleUpdateSalary = async (e) => {
    e.preventDefault();
    try {
      await payrollApi.updateSalary(editEmployee.id, salaryForm);
      showToast(`Salary structure updated for ${editEmployee.name}`, 'success');
      setEditEmployee(null);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return <div className="h-64 bg-slate-200 rounded-xl animate-pulse" />;
  }

  const { salary } = user;
  const grossSalary = (salary?.basic || 0) + (salary?.hra || 0) + (salary?.allowances || 0);
  const totalDeductions =
    (salary?.deductions?.pf || 0) +
    (salary?.deductions?.tax || 0) +
    (salary?.deductions?.insurance || 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Payroll & Compensation</h1>
          <p className="text-xs text-slate-500">
            Salary structure, statutory deductions, monthly pay slips, and executive compensation governance.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSelectedSlip({ month: 'August 2026', gross: grossSalary, net: salary?.netSalary })}
          icon={FileText}
          className="font-bold"
        >
          View August Pay Slip
        </Button>
      </div>

      {/* Admin / Company Payroll Overview */}
      {isManagement && companyPayroll && (
        <div className="space-y-6">
          {/* Company KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="enterprise-card p-4">
              <span className="text-[11px] font-bold uppercase text-slate-500">Total Monthly Net Payroll</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
                {formatCurrency(companyPayroll.summary.totalNet)}
              </p>
              <span className="text-[10px] text-emerald-600 font-bold">Processed for {companyPayroll.summary.headcount} staff</span>
            </div>

            <div className="enterprise-card p-4">
              <span className="text-[11px] font-bold uppercase text-slate-500">Total Gross Expense</span>
              <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
                {formatCurrency(companyPayroll.summary.totalGross)}
              </p>
              <span className="text-[10px] text-slate-500">Includes all allowances</span>
            </div>

            <div className="enterprise-card p-4 border-blue-200 bg-blue-50/20">
              <span className="text-[11px] font-bold uppercase text-blue-700">Tax Withheld (TDS)</span>
              <p className="text-2xl font-extrabold text-blue-800 mt-1 tabular-nums">
                {formatCurrency(companyPayroll.summary.totalTax)}
              </p>
              <span className="text-[10px] text-blue-600">Remitted to Revenue Dept</span>
            </div>

            <div className="enterprise-card p-4 border-indigo-200 bg-indigo-50/20">
              <span className="text-[11px] font-bold uppercase text-indigo-700">Provident Fund (PF)</span>
              <p className="text-2xl font-extrabold text-indigo-800 mt-1 tabular-nums">
                {formatCurrency(companyPayroll.summary.totalPf)}
              </p>
              <span className="text-[10px] text-indigo-600">Statutory deposit</span>
            </div>
          </div>

          {/* Department Breakdown Chart */}
          <div className="enterprise-card p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">Department Payroll Distribution</h3>
            <p className="text-xs text-slate-500 mb-4">Monthly salary expense allocation across business units</p>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyPayroll.departmentBreakdown} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="department" tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Monthly Net Expense']}
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="totalExpense" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Organization Payroll Register Table */}
          <div className="enterprise-card overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Organization Compensation Register</h3>
              <p className="text-xs text-slate-500">Employee-by-employee salary structures and effective dates</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Employee</th>
                    <th className="px-6 py-3.5">Department</th>
                    <th className="px-6 py-3.5">Basic</th>
                    <th className="px-6 py-3.5">HRA & Allowances</th>
                    <th className="px-6 py-3.5">Deductions</th>
                    <th className="px-6 py-3.5">Net Salary</th>
                    {isAdmin && <th className="px-6 py-3.5 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {companyPayroll.employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5">
                        <span className="font-bold text-slate-900">{emp.name}</span>
                        <span className="text-[11px] text-slate-400 block font-mono">{emp.id}</span>
                      </td>
                      <td className="px-6 py-3.5">{emp.department}</td>
                      <td className="px-6 py-3.5 font-mono">{formatCurrency(emp.basic)}</td>
                      <td className="px-6 py-3.5 font-mono">{formatCurrency(emp.hra + emp.allowances)}</td>
                      <td className="px-6 py-3.5 font-mono text-rose-600">
                        -{formatCurrency(emp.deductions.pf + emp.deductions.tax + emp.deductions.insurance)}
                      </td>
                      <td className="px-6 py-3.5 font-mono font-extrabold text-emerald-700">
                        {formatCurrency(emp.netSalary)}
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-3.5 text-right">
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => {
                              setEditEmployee(emp);
                              setSalaryForm({
                                basic: emp.basic,
                                hra: emp.hra,
                                allowances: emp.allowances,
                                effectiveDate: emp.effectiveDate,
                              });
                            }}
                            icon={Edit2}
                          >
                            Revise
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Employee Personal Payroll Breakdown */}
      <div className="enterprise-card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Your Monthly Compensation Breakdown</h3>
            <p className="text-xs text-slate-500">Effective Date: {salary?.effectiveDate || '2026-01-01'}</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            Net Monthly Pay: {formatCurrency(salary?.netSalary)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Earnings */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Earnings & Allowances</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Basic Salary</span>
                <span className="font-bold text-slate-900 font-mono">{formatCurrency(salary?.basic)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">House Rent Allowance (HRA)</span>
                <span className="font-bold text-slate-900 font-mono">{formatCurrency(salary?.hra)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Special & Performance Allowances</span>
                <span className="font-bold text-slate-900 font-mono">{formatCurrency(salary?.allowances)}</span>
              </div>
              <div className="flex justify-between pt-2 text-sm font-extrabold text-blue-700">
                <span>Total Gross Earnings</span>
                <span className="font-mono">{formatCurrency(grossSalary)}</span>
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Statutory Deductions</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Provident Fund (PF - 12%)</span>
                <span className="font-bold text-rose-600 font-mono">-{formatCurrency(salary?.deductions?.pf)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Income Tax (TDS)</span>
                <span className="font-bold text-rose-600 font-mono">-{formatCurrency(salary?.deductions?.tax)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600">Medical Insurance Coverage</span>
                <span className="font-bold text-rose-600 font-mono">-{formatCurrency(salary?.deductions?.insurance)}</span>
              </div>
              <div className="flex justify-between pt-2 text-sm font-extrabold text-rose-700">
                <span>Total Deductions</span>
                <span className="font-mono">-{formatCurrency(totalDeductions)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pay Slip Modal */}
      {selectedSlip && (
        <Modal
          isOpen={!!selectedSlip}
          onClose={() => setSelectedSlip(null)}
          title={`Pay Slip Statement — ${selectedSlip.month}`}
          subtitle="DAYFLOW Enterprise Payroll Document"
          maxWidth="max-w-2xl"
        >
          <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-6 text-xs font-sans">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">DAYFLOW HRMS</h2>
                <p className="text-xs text-slate-500">Workforce Intelligence & Payroll Division</p>
                <p className="text-[10px] text-slate-400 mt-1">CIN: U74999CA2026PTC88190</p>
              </div>
              <div className="text-right">
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded">
                  PAID & DISBURSED
                </span>
                <p className="text-xs font-bold text-slate-700 mt-1">Period: {selectedSlip.month}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px]">
              <div>Employee Name: <strong>{user.name}</strong></div>
              <div>Employee ID: <strong className="font-mono">{user.id}</strong></div>
              <div>Department: <strong>{user.department}</strong></div>
              <div>Bank Account: <strong>•••• 8821</strong></div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h5 className="font-bold text-slate-900 mb-2 uppercase text-[10px] tracking-wider">Earnings</h5>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between"><span>Basic:</span><span className="font-mono font-bold">{formatCurrency(salary.basic)}</span></div>
                  <div className="flex justify-between"><span>HRA:</span><span className="font-mono font-bold">{formatCurrency(salary.hra)}</span></div>
                  <div className="flex justify-between"><span>Allowances:</span><span className="font-mono font-bold">{formatCurrency(salary.allowances)}</span></div>
                </div>
              </div>
              <div>
                <h5 className="font-bold text-slate-900 mb-2 uppercase text-[10px] tracking-wider">Deductions</h5>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between"><span>PF:</span><span className="font-mono font-bold text-rose-600">-{formatCurrency(salary.deductions.pf)}</span></div>
                  <div className="flex justify-between"><span>Tax (TDS):</span><span className="font-mono font-bold text-rose-600">-{formatCurrency(salary.deductions.tax)}</span></div>
                  <div className="flex justify-between"><span>Insurance:</span><span className="font-mono font-bold text-rose-600">-{formatCurrency(salary.deductions.insurance)}</span></div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center text-sm font-extrabold text-emerald-900">
              <span>Net Disbursed Salary:</span>
              <span className="text-lg font-mono">{formatCurrency(selectedSlip.net)}</span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setSelectedSlip(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                icon={Download}
                onClick={() => {
                  window.print();
                }}
              >
                Print / Save PDF
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Salary Revision Modal (Admin) */}
      {editEmployee && (
        <Modal
          isOpen={!!editEmployee}
          onClose={() => setEditEmployee(null)}
          title={`Revise Salary — ${editEmployee.name}`}
          subtitle="Modify compensation components and update effective date"
        >
          <form onSubmit={handleUpdateSalary} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700">Basic Salary ($/mo)</label>
              <input
                type="number"
                required
                value={salaryForm.basic}
                onChange={(e) => setSalaryForm({ ...salaryForm, basic: Number(e.target.value) })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700">HRA ($/mo)</label>
                <input
                  type="number"
                  required
                  value={salaryForm.hra}
                  onChange={(e) => setSalaryForm({ ...salaryForm, hra: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700">Allowances ($/mo)</label>
                <input
                  type="number"
                  required
                  value={salaryForm.allowances}
                  onChange={(e) => setSalaryForm({ ...salaryForm, allowances: Number(e.target.value) })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-blue-900">
              Estimated Monthly Net: <strong>{formatCurrency(salaryForm.basic + salaryForm.hra + salaryForm.allowances - Math.round(salaryForm.basic * 0.32))}</strong>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditEmployee(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save & Update Payroll
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
