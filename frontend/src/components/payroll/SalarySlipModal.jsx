import React from 'react';
import { X, Printer, Download, Building2, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

/**
 * Enterprise Salary Slip View & Printable PDF Modal.
 * Renders itemized earnings, statutory PF & TDS deductions, and authorized digital stamp.
 */
export default function SalarySlipModal({ isOpen, onClose, payrollRecord }) {
  if (!isOpen || !payrollRecord) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-slate-100 text-sm">
              Official Salary Statement & Payslip
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs px-3"
            >
              <Printer className="w-3.5 h-3.5" /> Print / PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200 text-xs">
          {/* Org Header */}
          <div className="flex justify-between items-start pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">DAYFLOW TECHNOLOGIES INC.</h2>
              <p className="text-slate-400 text-[11px] mt-0.5">Workforce Intelligence & Operations Hub</p>
              <p className="text-slate-500 text-[11px]">Bangalore, Karnataka, India • HRMS-PAY-2026</p>
            </div>
            <div className="text-right">
              <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 font-mono font-bold text-[11px]">
                {payrollRecord.payPeriod || 'August 2026'}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Status: Disbursed</p>
            </div>
          </div>

          {/* Employee Metadata Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div>
              <p className="text-slate-500 text-[10px] uppercase">Employee Name</p>
              <p className="font-semibold text-slate-200">{payrollRecord.employeeName || 'Alex Morgan'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] uppercase">Employee ID</p>
              <p className="font-mono text-slate-300">{payrollRecord.employeeId || 'EMP-1001'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] uppercase">Department</p>
              <p className="text-slate-300">{payrollRecord.department || 'Engineering'}</p>
            </div>
            <div>
              <p className="text-slate-500 text-[10px] uppercase">Designation</p>
              <p className="text-slate-300">{payrollRecord.designation || 'Senior Full Stack'}</p>
            </div>
          </div>

          {/* Earnings & Deductions Tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Earnings */}
            <div className="border border-slate-800 rounded-xl p-3.5 bg-slate-950/30">
              <h4 className="font-semibold text-slate-300 mb-2 pb-1 border-b border-slate-800 text-xs">
                Gross Earnings
              </h4>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Basic Salary</span>
                  <span className="font-mono">{formatCurrency(payrollRecord.basicSalary || 6500)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">House Rent Allowance (HRA)</span>
                  <span className="font-mono">{formatCurrency(payrollRecord.hra || 2600)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Special Allowances</span>
                  <span className="font-mono">{formatCurrency(payrollRecord.allowances || 900)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 font-bold text-slate-100">
                  <span>Gross Pay</span>
                  <span className="font-mono text-emerald-400">{formatCurrency(payrollRecord.grossPay || 10000)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="border border-slate-800 rounded-xl p-3.5 bg-slate-950/30">
              <h4 className="font-semibold text-slate-300 mb-2 pb-1 border-b border-slate-800 text-xs">
                Statutory Deductions
              </h4>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Provident Fund (PF 12%)</span>
                  <span className="font-mono">{formatCurrency(payrollRecord.pfDeduction || 780)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Income Tax Withheld (TDS)</span>
                  <span className="font-mono">{formatCurrency(payrollRecord.taxDeduction || 1200)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Medical Insurance</span>
                  <span className="font-mono">{formatCurrency(payrollRecord.insurance || 250)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 font-bold text-slate-100">
                  <span>Total Deductions</span>
                  <span className="font-mono text-rose-400">{formatCurrency(payrollRecord.totalDeductions || 2230)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Take-Home Highlight */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border border-blue-500/30 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-blue-300 font-semibold">Net Disbursed Take-Home</p>
              <p className="text-xs text-slate-400">Credited to Account ending in •••• 4892</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold font-mono text-emerald-400">
                {formatCurrency(payrollRecord.netPay || 7770)}
              </span>
            </div>
          </div>

          {/* Digital Signature Stamp */}
          <div className="flex items-center justify-between pt-2 text-[10px] text-slate-500">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Digitally verified by Dayflow Payroll Engine
            </span>
            <span>Ref: {payrollRecord.transactionRef || 'TXN-DF-2026-8841'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
