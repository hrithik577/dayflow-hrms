export const ROLES = {
  EMPLOYEE: 'EMPLOYEE',
  HR: 'HR',
  ADMIN: 'ADMIN',
};

export const LEAVE_TYPES = {
  PAID: { label: 'Paid Leave / Annual', quota: 18, color: 'blue' },
  SICK: { label: 'Sick / Medical Leave', quota: 10, color: 'rose' },
  CASUAL: { label: 'Casual / Personal Leave', quota: 6, color: 'amber' },
  MATERNITY_PATERNITY: { label: 'Parental Leave', quota: 60, color: 'purple' },
  UNPAID: { label: 'Unpaid Leave (LWP)', quota: 0, color: 'slate' },
};

export const ATTENDANCE_STATUS = {
  PRESENT: { label: 'Present', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  LATE: { label: 'Late Arrival', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  HALF_DAY: { label: 'Half Day', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  ON_LEAVE: { label: 'On Leave', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  ABSENT: { label: 'Absent', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const LEAVE_STATUS = {
  PENDING: { label: 'Pending HR Review', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  APPROVED: { label: 'Approved', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REJECTED: { label: 'Rejected', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  CANCELLED: { label: 'Cancelled', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export const INSIGHT_SEVERITY = {
  HEALTHY: { label: 'Healthy', color: 'emerald', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  REVIEW: { label: 'Review', color: 'amber', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  ATTENTION: { label: 'Attention', color: 'rose', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const DEPARTMENTS = [
  'All Departments',
  'Engineering',
  'Product & Design',
  'Human Resources',
  'Sales & Marketing',
  'Finance & Operations',
];
