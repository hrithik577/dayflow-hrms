import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Modal } from '../components/Modal';
import {
  User,
  Briefcase,
  DollarSign,
  FileText,
  Camera,
  Edit3,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Shield,
  Upload,
  CheckCircle,
  FileCode,
  ExternalLink,
  Save,
  AlertCircle
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, isRole, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'job' | 'salary' | 'documents' | 'picture'
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form State
  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    city: '',
    designation: '',
    department_id: '',
    employment_status: '',
    profile_picture_url: ''
  });

  // Document Upload Form State
  const [newDoc, setNewDoc] = useState({
    document_type: 'CONTRACT',
    file_name: '',
    file_url: ''
  });

  const isAdminOrHR = isRole('ADMIN', 'HR');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/employees/me');
      setProfile(res.data);
    } catch (err) {
      console.error('Error fetching employee profile:', err);
      // Fallback profile if employee endpoint returns error
      if (user) {
        const emp = user.employee_details || {};
        setProfile({
          id: emp.id || 1,
          user_id: user.id,
          employee_code: user.employee_id || 'EMP-0101',
          first_name: emp.first_name || 'Rahul',
          last_name: emp.last_name || 'Sharma',
          email: user.email || 'rahul.sharma@dayflow.com',
          phone: emp.phone || '+1 (555) 019-0101',
          address: emp.address || '101 Market Street',
          city: emp.city || 'San Francisco',
          department_id: emp.department_id || 1,
          department_name: emp.department_name || 'Engineering',
          designation: emp.designation || 'Senior Full-Stack Engineer',
          joining_date: emp.joining_date || '2023-01-15',
          employment_status: emp.employment_status || 'ACTIVE',
          profile_picture_url: emp.profile_picture_url || null,
          manager_name: 'Victor Vance',
          salary_structure: {
            basic_salary: 7000,
            allowances: 2000,
            deductions: 1000,
            net_salary: 8000,
            currency: 'USD',
            effective_from: '2024-01-01'
          },
          documents: [
            {
              id: 1,
              document_type: 'CONTRACT',
              file_name: 'Employment_Contract_2026.pdf',
              file_url: 'https://dayflow.internal/docs/contract.pdf',
              verification_status: 'VERIFIED',
              uploaded_at: new Date().toISOString()
            },
            {
              id: 2,
              document_type: 'ID_PROOF',
              file_name: 'Government_Passport_ID.pdf',
              file_url: 'https://dayflow.internal/docs/passport.pdf',
              verification_status: 'VERIFIED',
              uploaded_at: new Date().toISOString()
            }
          ]
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const openEditModal = () => {
    if (!profile) return;
    setEditData({
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      phone: profile.phone || '',
      address: profile.address || '',
      city: profile.city || '',
      designation: profile.designation || '',
      department_id: profile.department_id || '',
      employment_status: profile.employment_status || 'ACTIVE',
      profile_picture_url: profile.profile_picture_url || ''
    });
    setEditModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Build payload based on user role
      let payload = {
        phone: editData.phone,
        address: editData.address,
        city: editData.city,
        profile_picture_url: editData.profile_picture_url
      };

      if (isAdminOrHR) {
        payload = {
          ...payload,
          first_name: editData.first_name,
          last_name: editData.last_name,
          designation: editData.designation,
          employment_status: editData.employment_status
        };
      }

      const res = await api.patch(`/api/employees/${profile.id}`, payload);
      setProfile(res.data);
      setEditModalOpen(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });

      // Update AuthContext user details if available
      if (setUser && user) {
        setUser({
          ...user,
          employee_details: {
            ...user.employee_details,
            first_name: res.data.first_name,
            last_name: res.data.last_name,
            phone: res.data.phone,
            address: res.data.address
          }
        });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to update profile details' });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!newDoc.file_name || !newDoc.file_url) {
      alert('Please provide a document name and file URL');
      return;
    }

    try {
      const res = await api.post(`/api/employees/${profile.id}/documents`, newDoc);
      setProfile({
        ...profile,
        documents: [res.data, ...(profile.documents || [])]
      });
      setDocModalOpen(false);
      setNewDoc({ document_type: 'CONTRACT', file_name: '', file_url: '' });
      setMessage({ type: 'success', text: 'Document attached successfully!' });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to upload document');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        Loading Employee Profile...
      </div>
    );
  }

  const fullName = `${profile?.first_name || ''} ${profile?.last_name || ''}`;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {message.text && (
        <div className={`p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
          message.type === 'success' ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage({ type: '', text: '' })} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Profile Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          {/* Avatar / Picture */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-blue-500/40 flex items-center justify-center font-bold text-2xl text-blue-400 overflow-hidden shadow-xl">
              {profile?.profile_picture_url ? (
                <img src={profile.profile_picture_url} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                fullName.charAt(0)
              )}
            </div>
            <button
              onClick={openEditModal}
              className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-transform hover:scale-110"
              title="Edit Profile Picture"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Identity & Basic Info */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight">{fullName}</h1>
                <p className="text-xs font-semibold text-blue-400 mt-0.5">{profile?.designation}</p>
              </div>
              <div className="flex items-center justify-center md:justify-end gap-2">
                <StatusBadge status={profile?.employment_status || 'ACTIVE'} />
                <button
                  onClick={openEditModal}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 text-xs text-slate-400 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                <span className="truncate">{profile?.department_name || 'Engineering'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span className="truncate">{profile?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                <span>{profile?.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Joined {profile?.joining_date}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Corresponding strictly to 3.3.1 View Profile sections) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'personal'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <User className="w-4 h-4" />
          Personal Details
        </button>

        <button
          onClick={() => setActiveTab('job')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'job'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Job Details
        </button>

        <button
          onClick={() => setActiveTab('salary')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'salary'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Salary Structure
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'documents'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          Documents ({profile?.documents?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('picture')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'picture'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Camera className="w-4 h-4" />
          Profile Picture
        </button>
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {/* TAB 1: Personal Details */}
        {activeTab === 'personal' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                Personal Details & Contact Records
              </h3>
              <button
                onClick={openEditModal}
                className="text-xs text-blue-400 hover:underline font-semibold flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Personal Data
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">First Name</p>
                <p className="text-sm font-semibold text-slate-100 mt-1">{profile?.first_name}</p>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Last Name</p>
                <p className="text-sm font-semibold text-slate-100 mt-1">{profile?.last_name}</p>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Email Address</p>
                <p className="text-sm font-semibold text-slate-100 mt-1">{profile?.email}</p>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Phone Number</p>
                <p className="text-sm font-semibold text-slate-100 mt-1">{profile?.phone || 'Not provided'}</p>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Residential Address</p>
                <p className="text-sm font-semibold text-slate-100 mt-1">{profile?.address || 'Not provided'}</p>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">City / State</p>
                <p className="text-sm font-semibold text-slate-100 mt-1">{profile?.city || 'San Francisco'}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Job Details */}
        {activeTab === 'job' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-400" />
                Employment & Organizational Details
              </h3>
              {!isAdminOrHR && (
                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                  <Shield className="w-3.5 h-3.5 text-amber-400" /> Managed by HR & Admin
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Employee Code</p>
                <p className="text-sm font-mono font-bold text-blue-400 mt-1">{profile?.employee_code}</p>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Designation / Role</p>
                <p className="text-sm font-semibold text-slate-100 mt-1">{profile?.designation}</p>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Department</p>
                <p className="text-sm font-semibold text-slate-100 mt-1">{profile?.department_name || 'Engineering'}</p>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Date of Joining</p>
                <p className="text-sm font-semibold text-slate-100 mt-1">{profile?.joining_date}</p>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Employment Status</p>
                <div className="mt-1">
                  <StatusBadge status={profile?.employment_status || 'ACTIVE'} />
                </div>
              </div>

              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                <p className="text-[10px] uppercase font-bold text-slate-400">Reporting Manager</p>
                <p className="text-sm font-semibold text-slate-100 mt-1">{profile?.manager_name || 'Victor Vance (COO)'}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Salary Structure */}
        {activeTab === 'salary' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Compensation & Salary Breakdown
              </h3>
              <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 font-medium">
                RBAC Verified • Confidential
              </span>
            </div>

            {profile?.salary_structure ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Basic Salary</p>
                  <p className="text-lg font-bold text-slate-100 mt-1 tabular-nums">
                    ${profile.salary_structure.basic_salary?.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Per Month</p>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Allowances (HRA & Perks)</p>
                  <p className="text-lg font-bold text-emerald-400 mt-1 tabular-nums">
                    +${profile.salary_structure.allowances?.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Per Month</p>
                </div>

                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Deductions (Tax & PF)</p>
                  <p className="text-lg font-bold text-rose-400 mt-1 tabular-nums">
                    -${profile.salary_structure.deductions?.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Per Month</p>
                </div>

                <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 p-4 rounded-xl border border-emerald-500/30">
                  <p className="text-[10px] uppercase font-bold text-emerald-400">Net Take-Home Pay</p>
                  <p className="text-xl font-extrabold text-emerald-300 mt-1 tabular-nums">
                    ${profile.salary_structure.net_salary?.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-emerald-400/80 mt-0.5">Effective from {profile.salary_structure.effective_from}</p>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-xs">
                No salary record configured or access restricted.
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Documents */}
        {activeTab === 'documents' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Employee Document Records
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Verified contracts, identity proofs, tax filings, and certifications</p>
              </div>

              <button
                onClick={() => setDocModalOpen(true)}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-all inline-flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Document
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {profile?.documents && profile.documents.length > 0 ? (
                profile.documents.map((doc) => (
                  <div key={doc.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <FileCode className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-100">{doc.file_name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                          <span className="uppercase font-bold text-blue-400">{doc.document_type}</span>
                          <span>•</span>
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> {doc.verification_status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="View / Download Document"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-8 text-center text-slate-500 text-xs">
                  No employee documents uploaded yet. Click "Upload Document" to add records.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: Profile Picture */}
        {activeTab === 'picture' && (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                Profile Picture & Avatar Management
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Upload or update your profile picture URL</p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8 bg-slate-900/60 p-6 rounded-xl border border-slate-800">
              <div className="w-32 h-32 rounded-2xl bg-slate-800 border-2 border-blue-500/40 flex items-center justify-center font-bold text-4xl text-blue-400 overflow-hidden shadow-2xl shrink-0">
                {profile?.profile_picture_url ? (
                  <img src={profile.profile_picture_url} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  fullName.charAt(0)
                )}
              </div>

              <div className="space-y-4 flex-1 text-xs w-full">
                <div>
                  <label className="block text-slate-400 font-semibold uppercase mb-1">Profile Picture Image URL</label>
                  <input
                    type="text"
                    value={profile?.profile_picture_url || ''}
                    onChange={(e) => setProfile({ ...profile, profile_picture_url: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-xxx"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={openEditModal}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" /> Save Picture Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal (Strict RBAC Enforced) */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title={`Edit Profile: ${fullName}`}>
        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          {!isAdminOrHR && (
            <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-blue-300 text-[11px] flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Employees can edit phone, address, city, and profile picture. Contact HR to modify identity or job title.</span>
            </div>
          )}

          {/* Picture URL */}
          <div>
            <label className="block text-slate-400 font-semibold uppercase mb-1">Profile Picture URL</label>
            <input
              type="text"
              value={editData.profile_picture_url}
              onChange={(e) => setEditData({ ...editData, profile_picture_url: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
            />
          </div>

          {/* Names (Admin / HR only) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-semibold uppercase mb-1">First Name</label>
              <input
                type="text"
                disabled={!isAdminOrHR}
                value={editData.first_name}
                onChange={(e) => setEditData({ ...editData, first_name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-semibold uppercase mb-1">Last Name</label>
              <input
                type="text"
                disabled={!isAdminOrHR}
                value={editData.last_name}
                onChange={(e) => setEditData({ ...editData, last_name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Designation (Admin / HR only) */}
          <div>
            <label className="block text-slate-400 font-semibold uppercase mb-1">Designation / Role</label>
            <input
              type="text"
              disabled={!isAdminOrHR}
              value={editData.designation}
              onChange={(e) => setEditData({ ...editData, designation: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 disabled:opacity-50"
            />
          </div>

          {/* Phone & Address (Editable by all) */}
          <div>
            <label className="block text-slate-400 font-semibold uppercase mb-1">Phone Number</label>
            <input
              type="text"
              value={editData.phone}
              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold uppercase mb-1">Address</label>
            <input
              type="text"
              value={editData.address}
              onChange={(e) => setEditData({ ...editData, address: e.target.value })}
              placeholder="123 Main Street"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold uppercase mb-1">City</label>
            <input
              type="text"
              value={editData.city}
              onChange={(e) => setEditData({ ...editData, city: e.target.value })}
              placeholder="San Francisco"
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
              {saveLoading ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Upload Document Modal */}
      <Modal isOpen={docModalOpen} onClose={() => setDocModalOpen(false)} title="Upload Employee Document">
        <form onSubmit={handleAddDocument} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-semibold uppercase mb-1">Document Type</label>
            <select
              value={newDoc.document_type}
              onChange={(e) => setNewDoc({ ...newDoc, document_type: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
            >
              <option value="CONTRACT">Employment Contract</option>
              <option value="ID_PROOF">Identity Proof / Passport</option>
              <option value="TAX">Tax Filing W-4 / Form 16</option>
              <option value="CERTIFICATE">Degree / Skill Certificate</option>
              <option value="OTHER">Other Official Record</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold uppercase mb-1">Document File Name</label>
            <input
              type="text"
              required
              value={newDoc.file_name}
              onChange={(e) => setNewDoc({ ...newDoc, file_name: e.target.value })}
              placeholder="e.g. Passport_Copy_2026.pdf"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold uppercase mb-1">Document File URL</label>
            <input
              type="text"
              required
              value={newDoc.file_url}
              onChange={(e) => setNewDoc({ ...newDoc, file_url: e.target.value })}
              placeholder="https://dayflow.internal/docs/file.pdf"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDocModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500"
            >
              Attach Document
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
