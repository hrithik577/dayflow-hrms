import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Search,
  Edit,
  Eye,
  Mail,
  Phone,
  Building,
  Calendar,
  DollarSign,
  FileText,
  User,
  Briefcase,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');

  // Edit fields
  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    city: '',
    designation: '',
    profile_picture_url: '',
    employment_status: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);

  const { isRole } = useAuth();
  const isHR = isRole('HR', 'ADMIN');

  const fetchEmployees = async () => {
    try {
      setLoading(true);
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

  const openViewModal = (emp) => {
    setSelectedEmp(emp);
    setActiveTab('personal');
    setViewModalOpen(true);
  };

  const openEditModal = (emp) => {
    setSelectedEmp(emp);
    setEditData({
      first_name: emp.first_name || '',
      last_name: emp.last_name || '',
      phone: emp.phone || '',
      address: emp.address || '',
      city: emp.city || 'San Francisco',
      designation: emp.designation || '',
      profile_picture_url: emp.profile_picture_url || '',
      employment_status: emp.employment_status || 'ACTIVE'
    });
    setEditModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedEmp) return;
    setSaveLoading(true);

    try {
      let payload = {
        phone: editData.phone,
        address: editData.address,
        city: editData.city,
        profile_picture_url: editData.profile_picture_url
      };

      if (isHR) {
        payload = {
          ...payload,
          first_name: editData.first_name,
          last_name: editData.last_name,
          designation: editData.designation,
          employment_status: editData.employment_status
        };
      }

      await api.patch(`/api/employees/${selectedEmp.id}`, payload);
      setEditModalOpen(false);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update employee profile');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Mobile-Friendly Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            Employee Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">View, search, and manage complete employee profiles & records</p>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, code, designation..."
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 w-full"
            />
          </div>
        </div>
      </div>

      {/* Mobile Card List View (Visible on Mobile screens < 640px) */}
      <div className="block sm:hidden space-y-3">
        {loading ? (
          <div className="p-6 text-center text-xs text-slate-500 glass-panel rounded-2xl">Loading employee directory...</div>
        ) : employees.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 glass-panel rounded-2xl">No employees found</div>
        ) : (
          employees.map((emp) => (
            <div key={emp.id} className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-blue-400 overflow-hidden shrink-0">
                    {emp.profile_picture_url ? (
                      <img src={emp.profile_picture_url} alt={emp.first_name} className="w-full h-full object-cover" />
                    ) : (
                      emp.first_name.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">{emp.first_name} {emp.last_name}</h3>
                    <p className="text-[11px] text-slate-400">{emp.designation}</p>
                  </div>
                </div>
                <StatusBadge status={emp.employment_status} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Employee Code</span>
                  <span className="font-mono text-blue-400 font-semibold">{emp.employee_code}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Department</span>
                  <span className="text-slate-200 font-medium">{emp.department_name}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => openViewModal(emp)}
                  className="flex-1 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> View Profile
                </button>
                <button
                  onClick={() => openEditModal(emp)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (Visible on Tablet/Desktop screens >= 640px) */}
      <div className="hidden sm:block glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 min-w-[650px]">
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
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-blue-400 overflow-hidden shrink-0">
                          {emp.profile_picture_url ? (
                            <img src={emp.profile_picture_url} alt={emp.first_name} className="w-full h-full object-cover" />
                          ) : (
                            emp.first_name.charAt(0)
                          )}
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
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openViewModal(emp)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-medium transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button
                        onClick={() => openEditModal(emp)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors inline-flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Full Profile Modal (3.3.1) */}
      {selectedEmp && (
        <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title={`Employee Profile: ${selectedEmp.first_name} ${selectedEmp.last_name}`}>
          <div className="space-y-4 text-xs">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-800 pb-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('personal')}
                className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 ${activeTab === 'personal' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                Personal
              </button>
              <button
                onClick={() => setActiveTab('job')}
                className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 ${activeTab === 'job' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                Job Details
              </button>
              <button
                onClick={() => setActiveTab('salary')}
                className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 ${activeTab === 'salary' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                Salary Structure
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-3 py-1.5 rounded-lg font-semibold shrink-0 ${activeTab === 'documents' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                Documents
              </button>
            </div>

            {/* Personal Details Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/60 p-3 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">First Name</p>
                    <p className="font-semibold text-slate-100 mt-0.5">{selectedEmp.first_name}</p>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Last Name</p>
                    <p className="font-semibold text-slate-100 mt-0.5">{selectedEmp.last_name}</p>
                  </div>
                </div>
                <div className="bg-slate-800/60 p-3 rounded-xl">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Email</p>
                  <p className="font-semibold text-slate-100 mt-0.5">{selectedEmp.email}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/60 p-3 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Phone</p>
                    <p className="font-semibold text-slate-100 mt-0.5">{selectedEmp.phone || 'Not provided'}</p>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Address & City</p>
                    <p className="font-semibold text-slate-100 mt-0.5">{selectedEmp.address || 'N/A'}, {selectedEmp.city || 'San Francisco'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Job Details Tab */}
            {activeTab === 'job' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/60 p-3 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Employee Code</p>
                    <p className="font-mono font-bold text-blue-400 mt-0.5">{selectedEmp.employee_code}</p>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Designation</p>
                    <p className="font-semibold text-slate-100 mt-0.5">{selectedEmp.designation}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/60 p-3 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Department</p>
                    <p className="font-semibold text-slate-100 mt-0.5">{selectedEmp.department_name}</p>
                  </div>
                  <div className="bg-slate-800/60 p-3 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Joining Date</p>
                    <p className="font-semibold text-slate-100 mt-0.5">{selectedEmp.joining_date}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Salary Structure Tab */}
            {activeTab === 'salary' && (
              <div className="space-y-3">
                {selectedEmp.salary_structure ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-800/60 p-3 rounded-xl">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Basic Salary</p>
                      <p className="font-bold text-slate-100 mt-0.5">${selectedEmp.salary_structure.basic_salary?.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-800/60 p-3 rounded-xl">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Allowances</p>
                      <p className="font-bold text-emerald-400 mt-0.5">+${selectedEmp.salary_structure.allowances?.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-800/60 p-3 rounded-xl">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Deductions</p>
                      <p className="font-bold text-rose-400 mt-0.5">-${selectedEmp.salary_structure.deductions?.toLocaleString()}</p>
                    </div>
                    <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-xl">
                      <p className="text-[10px] text-emerald-400 uppercase font-bold">Net Salary</p>
                      <p className="font-extrabold text-emerald-300 mt-0.5">${selectedEmp.salary_structure.net_salary?.toLocaleString()}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">Salary details restricted or not available.</p>
                )}
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-2">
                {selectedEmp.documents && selectedEmp.documents.length > 0 ? (
                  selectedEmp.documents.map((doc) => (
                    <div key={doc.id} className="p-3 bg-slate-800/60 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-100">{doc.file_name}</p>
                        <p className="text-[10px] text-blue-400 font-bold uppercase">{doc.document_type}</p>
                      </div>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-center py-4">No documents uploaded for this employee.</p>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Edit Profile Modal (3.3.2 RBAC enforced) */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit Employee Profile`}>
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Profile Picture */}
          <div>
            <label className="block text-slate-400 mb-1 font-semibold uppercase">Profile Picture URL</label>
            <input
              type="text"
              value={editData.profile_picture_url}
              onChange={(e) => setEditData({ ...editData, profile_picture_url: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold uppercase">First Name</label>
              <input
                type="text"
                disabled={!isHR}
                value={editData.first_name}
                onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold uppercase">Last Name</label>
              <input
                type="text"
                disabled={!isHR}
                value={editData.last_name}
                onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold uppercase">Designation</label>
            <input
              type="text"
              disabled={!isHR}
              value={editData.designation}
              onChange={(e) => setEditData({ ...editData, designation: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold uppercase">Phone</label>
            <input
              type="text"
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-semibold uppercase">Address</label>
            <input
              type="text"
              value={editData.address}
              onChange={(e) => setEditData({ ...editData, address: e.target.value })}
              placeholder="123 Main Street"
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
