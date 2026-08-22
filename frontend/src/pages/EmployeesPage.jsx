import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Users, Search, Filter, Edit, Mail, Phone, MapPin, Building, Calendar } from 'lucide-react';

export const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDesignation, setEditDesignation] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const { isRole } = useAuth();
  const isHR = isRole('HR', 'ADMIN');

  const fetchEmployees = async () => {
    try {
      let url = `/api/employees?search=${encodeURIComponent(search)}`;
      if (selectedDept) url += `&department_id=${selectedDept}`;
      const res = await api.get(url);
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, selectedDept]);

  const openEditModal = (emp) => {
    setSelectedEmp(emp);
    setEditPhone(emp.phone || '');
    setEditAddress(emp.address || '');
    setEditDesignation(emp.designation || '');
    setEditModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;
    setSaveLoading(true);

    try {
      await api.patch(`/api/employees/${selectedEmp.id}`, {
        phone: editPhone,
        address: editAddress,
        designation: editDesignation
      });
      setEditModalOpen(false);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update employee profile');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            Employee Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">View, search, and manage workforce profiles</p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code, designation..."
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-64"
            />
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Designation</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading directory...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No employees found</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-blue-400">
                          {emp.first_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100">{emp.first_name} {emp.last_name}</p>
                          <p className="text-[11px] text-slate-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-300">{emp.employee_code}</td>
                    <td className="px-6 py-4">{emp.department_name}</td>
                    <td className="px-6 py-4 font-medium text-slate-200">{emp.designation}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={emp.employment_status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(emp)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit Profile: ${selectedEmp?.first_name} ${selectedEmp?.last_name}`}>
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold uppercase">Designation</label>
            <input
              type="text"
              disabled={!isHR}
              value={editDesignation}
              onChange={(e) => setEditDesignation(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold uppercase">Phone Number</label>
            <input
              type="text"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold uppercase">Address</label>
            <input
              type="text"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              placeholder="Address"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
            />
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
              {saveLoading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
