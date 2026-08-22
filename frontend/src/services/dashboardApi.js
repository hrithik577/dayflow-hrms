import { apiClient, localDB } from './apiClient';

export const dashboardApi = {
  getEmployeeDashboard: async (employeeId) => {
    try {
      const res = await apiClient.get(`/dashboard/employee/${employeeId}`);
      return res.data;
    } catch {
      const db = localDB.get();
      const emp = db.employees.find((e) => e.id === employeeId) || db.employees[2]; // Alex Morgan
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = db.attendance.find((a) => a.employeeId === emp.id && a.date === today) || null;
      const myLeaves = db.leaves.filter((l) => l.employeeId === emp.id);
      const pendingLeaves = myLeaves.filter((l) => l.status === 'PENDING');

      // Weekly attendance trend (Mon-Fri)
      const weeklyAttendance = [
        { day: 'Mon', logged: 8.5, expected: 8.0 },
        { day: 'Tue', logged: 8.2, expected: 8.0 },
        { day: 'Wed', logged: 9.1, expected: 8.0 },
        { day: 'Thu', logged: 8.4, expected: 8.0 },
        { day: 'Fri', logged: 7.8, expected: 8.0 },
      ];

      return {
        employee: emp,
        todayAttendance,
        leaveBalances: emp.leaveBalances,
        pendingLeaves,
        salarySummary: {
          netSalary: emp.salary.netSalary,
          effectiveDate: emp.salary.effectiveDate,
        },
        weeklyAttendance,
        recentActivity: db.timeline.slice(0, 5),
        notifications: db.notifications.filter((n) => !n.read).slice(0, 4),
      };
    }
  },

  getAdminCommandCenter: async () => {
    try {
      const res = await apiClient.get('/dashboard/admin');
      return res.data;
    } catch {
      const db = localDB.get();
      const totalEmployees = db.employees.length;
      const presentCount = db.attendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
      const lateCount = db.attendance.filter((a) => a.status === 'LATE').length;
      const onLeaveCount = db.attendance.filter((a) => a.status === 'ON_LEAVE').length;
      const absentCount = Math.max(0, totalEmployees - presentCount - onLeaveCount);
      const attendanceRate = Math.round((presentCount / Math.max(1, totalEmployees)) * 100);
      const pendingLeaves = db.leaves.filter((l) => l.status === 'PENDING');
      const aiSignalsCount = db.insights.filter((i) => i.severity === 'ATTENTION' || i.severity === 'REVIEW').length;

      // 14-day attendance trend data
      const attendanceTrend = [
        { date: 'Aug 09', rate: 94, present: 7, late: 0 },
        { date: 'Aug 10', rate: 96, present: 7, late: 1 },
        { date: 'Aug 11', rate: 92, present: 6, late: 1 },
        { date: 'Aug 12', rate: 98, present: 7, late: 0 },
        { date: 'Aug 15', rate: 95, present: 7, late: 1 },
        { date: 'Aug 16', rate: 91, present: 6, late: 2 },
        { date: 'Aug 17', rate: 97, present: 7, late: 0 },
        { date: 'Aug 18', rate: 94, present: 7, late: 1 },
        { date: 'Aug 19', rate: 90, present: 6, late: 2 },
        { date: 'Aug 22', rate: attendanceRate, present: presentCount, late: lateCount },
      ];

      // Department Health Matrix
      const departmentHealth = [
        { name: 'Engineering', headcount: 2, present: 1, onLeave: 0, late: 0, health: 'Warning (Staffing Clash)', healthColor: 'amber' },
        { name: 'Product & Design', headcount: 1, present: 1, onLeave: 0, late: 1, health: 'Optimal Velocity', healthColor: 'emerald' },
        { name: 'Human Resources', headcount: 2, present: 2, onLeave: 0, late: 1, health: 'Active', healthColor: 'emerald' },
        { name: 'Sales & Marketing', headcount: 1, present: 0, onLeave: 1, late: 0, health: 'Capacity Reduced', healthColor: 'blue' },
        { name: 'Finance & Operations', headcount: 1, present: 1, onLeave: 0, late: 0, health: 'Optimal', healthColor: 'emerald' },
      ];

      return {
        kpis: {
          totalEmployees,
          presentCount,
          absentCount,
          onLeaveCount,
          lateCount,
          attendanceRate,
          pendingLeavesCount: pendingLeaves.length,
          aiSignalsCount,
        },
        attendanceTrend,
        departmentHealth,
        pendingLeaves,
        insights: db.insights,
        recentActivity: db.timeline.slice(0, 6),
        recentAuditLogs: db.auditLogs.slice(0, 5),
      };
    }
  },
};
