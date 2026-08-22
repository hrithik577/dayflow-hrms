import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Grid,
  List,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  CreditCard,
  Clock,
  Shield,
  Edit2,
  Trash2,
  FileText,
  CheckCircle,
  X,
} from 'lucide-react';
import { employeeApi } from '../../services/employeeApi';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { DEPARTMENTS } from '../../utils/constants';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';

export default function EmployeeListPage() {
  const { user, isManagement, isAdmin } = useAuth();
  const { showToast } = useNotifications();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Selected employee for detailed profile drawer/modal
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // New employee form state
  const [newEmpData, setNewEmpData] = useState({
    name: '',
    email: '',
    department: 'Engineering',
    designation: '',
    role: 'EMPLOYEE',
    phone: '',
    location: 'San Francisco HQ',
    salary: { basic: 7500, hra: 2200, allowances: 1200, deductions: { pf: 900, tax: 1700, insurance: 250 }, netSalary: 8050 },
  });

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const res = await employeeApi.getAll({ search, department: selectedDept });
      setEmployees(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [search, selectedDept]);

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      await employeeApi.create(newEmpData);
      showToast('Employee successfully onboarded!', 'success');
      setShowAddModal(false);
      loadEmployees();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    try {
      await employeeApi.update(selectedEmployee.id, selectedEmployee);
      showToast('Profile updated successfully!', 'success');
      setShowEditModal(false);
      loadEmployees();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Employee Directory</h1>
          <p className="text-xs text-slate-500">
            Enterprise workforce roster, profiles, compensation structures, and departmental allocations.
          </p>
        </div>

        {isManagement && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowAddModal(true)}
            icon={UserPlus}
            className="font-bold"
          >
            Onboard Employee
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="enterprise-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, title, or email..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>

          {/* Department Filter */}
          <div className="w-48">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500'}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === 'table' ? (
        <div className="enterprise-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Employee</th>
                  <th className="px-6 py-3.5">ID</th>
                  <th className="px-6 py-3.5">Department</th>
                  <th className="px-6 py-3.5">Designation</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {employees.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 flex items-center gap-3">
                      <img
                        src={emp.avatar}
                        alt={emp.name}
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{emp.name}</div>
                        <div className="text-[11px] text-slate-500">{emp.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-600">{emp.id}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800">{emp.department}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{emp.designation}</td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          emp.role === 'ADMIN' ? 'rose' : emp.role === 'HR' ? 'amber' : 'blue'
                        }
                        size="xs"
                      >
                        {emp.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px] font-bold border border-emerald-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEmployee(emp);
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => (
            <div
              key={emp.id}
              onClick={() => setSelectedEmployee(emp)}
              className="enterprise-card p-5 cursor-pointer hover:border-blue-300 transition-all space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={emp.avatar}
                    alt={emp.name}
                    className="w-12 h-12 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{emp.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{emp.designation}</p>
                    <span className="text-[10px] font-mono font-semibold text-blue-600">{emp.id}</span>
                  </div>
                </div>
                <Badge
                  variant={emp.role === 'ADMIN' ? 'rose' : emp.role === 'HR' ? 'amber' : 'blue'}
                  size="xs"
                >
                  {emp.role}
                </Badge>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>{emp.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{emp.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Employee Profile Modal */}
      {selectedEmployee && (
        <Modal
          isOpen={!!selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          title="Employee Profile & Records"
          subtitle={`${selectedEmployee.name} • ${selectedEmployee.id}`}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6 text-xs">
            {/* Top Identity Block */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <img
                src={selectedEmployee.avatar}
                alt={selectedEmployee.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
              />
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">{selectedEmployee.name}</h3>
                    <p className="text-xs font-semibold text-slate-600">{selectedEmployee.designation}</p>
                  </div>
                  <Badge variant="blue" size="md">
                    {selectedEmployee.role}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 font-medium">
                  <div>Department: <strong className="text-slate-900">{selectedEmployee.department}</strong></div>
                  <div>Joining Date: <strong className="text-slate-900">{selectedEmployee.joiningDate}</strong></div>
                  <div>Location: <strong className="text-slate-900">{selectedEmployee.location}</strong></div>
                </div>
              </div>
            </div>

            {/* Compensation Details (Strictly RBAC Gated) */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-600" />
                Compensation Structure (RBAC Verified)
              </h4>

              {/* Show compensation if user is Admin/HR or looking at their own profile */}
              {isManagement || user.id === selectedEmployee.id ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Basic Salary</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5 tabular-nums">
                      {formatCurrency(selectedEmployee.salary?.basic)}
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">HRA Allowance</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5 tabular-nums">
                      {formatCurrency(selectedEmployee.salary?.hra)}
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Special Allowances</p>
                    <p className="text-sm font-bold text-slate-900 mt-0.5 tabular-nums">
                      {formatCurrency(selectedEmployee.salary?.allowances)}
                    </p>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-[10px] text-emerald-800 font-bold uppercase">Net Pay / Month</p>
                    <p className="text-sm font-extrabold text-emerald-800 mt-0.5 tabular-nums">
                      {formatCurrency(selectedEmployee.salary?.netSalary)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-rose-600" />
                  <span>Salary information is restricted to Admin, HR, and the employee themselves.</span>
                </div>
              )}
            </div>

            {/* Leave Balance Quotas */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Annual Leave Quotas & Utilization
              </h4>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Paid Leave</span>
                  <p className="text-base font-extrabold text-slate-900 mt-1 tabular-nums">
                    {selectedEmployee.leaveBalances?.PAID?.remaining} / {selectedEmployee.leaveBalances?.PAID?.total}
                  </p>
                  <span className="text-[10px] text-slate-400">days available</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Sick Leave</span>
                  <p className="text-base font-extrabold text-slate-900 mt-1 tabular-nums">
                    {selectedEmployee.leaveBalances?.SICK?.remaining} / {selectedEmployee.leaveBalances?.SICK?.total}
                  </p>
                  <span className="text-[10px] text-slate-400">days available</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Casual Leave</span>
                  <p className="text-base font-extrabold text-slate-900 mt-1 tabular-nums">
                    {selectedEmployee.leaveBalances?.CASUAL?.remaining} / {selectedEmployee.leaveBalances?.CASUAL?.total}
                  </p>
                  <span className="text-[10px] text-slate-400">days available</span>
                </div>
              </div>
            </div>

            {/* Emergency Contact & Admin Actions */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-700">Emergency Contact:</span>{' '}
                <span className="text-slate-600">
                  {selectedEmployee.emergencyContact?.name} ({selectedEmployee.emergencyContact?.relation}) —{' '}
                  {selectedEmployee.emergencyContact?.phone}
                </span>
              </div>

              {isAdmin && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setShowEditModal(true)}
                  icon={Edit2}
                >
                  Edit Employee
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Onboard New Employee Modal */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          title="Onboard New Employee"
          subtitle="Add employee records, assign department and compensation structure"
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700">Full Name</label>
              <input
                type="text"
                required
                value={newEmpData.name}
                onChange={(e) => setNewEmpData({ ...newEmpData, name: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="e.g. Rachel Adams"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700">Work Email</label>
              <input
                type="email"
                required
                value={newEmpData.email}
                onChange={(e) => setNewEmpData({ ...newEmpData, email: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="rachel.adams@dayflow.internal"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700">Department</label>
                <select
                  value={newEmpData.department}
                  onChange={(e) => setNewEmpData({ ...newEmpData, department: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  {DEPARTMENTS.filter((d) => d !== 'All Departments').map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-700">Role</label>
                <select
                  value={newEmpData.role}
                  onChange={(e) => setNewEmpData({ ...newEmpData, role: e.target.value })}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="HR">HR Officer</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-700">Job Title / Designation</label>
              <input
                type="text"
                required
                value={newEmpData.designation}
                onChange={(e) => setNewEmpData({ ...newEmpData, designation: e.target.value })}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg"
                placeholder="e.g. Senior Security Engineer"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save & Onboard
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
