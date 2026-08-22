import { apiClient, localDB } from './apiClient';

export const leaveApi = {
  getLeaves: async (params = {}) => {
    try {
      const res = await apiClient.get('/leaves', { params });
      return res.data;
    } catch {
      const db = localDB.get();
      let list = [...db.leaves];
      if (params.employeeId) {
        list = list.filter((l) => l.employeeId === params.employeeId);
      }
      if (params.status && params.status !== 'ALL') {
        list = list.filter((l) => l.status === params.status);
      }
      if (params.department && params.department !== 'All Departments') {
        list = list.filter((l) => l.department === params.department);
      }
      return list;
    }
  },

  applyLeave: async ({ employeeId, leaveType, startDate, endDate, daysCount, reason }) => {
    try {
      const res = await apiClient.post('/leaves/apply', { employeeId, leaveType, startDate, endDate, daysCount, reason });
      return res.data;
    } catch {
      const db = localDB.get();
      const emp = db.employees.find((e) => e.id === employeeId);
      if (!emp) throw new Error('Employee not found');

      // Check balance
      const balance = emp.leaveBalances[leaveType];
      if (balance && balance.remaining < daysCount && leaveType !== 'UNPAID') {
        throw new Error(`Insufficient ${leaveType} leave balance. Remaining: ${balance.remaining} days.`);
      }

      // Check smart clash detection in same department
      const departmentLeaves = db.leaves.filter(
        (l) =>
          l.department === emp.department &&
          l.status === 'APPROVED' &&
          ((startDate >= l.startDate && startDate <= l.endDate) || (endDate >= l.startDate && endDate <= l.endDate))
      );

      let aiClashWarning = null;
      if (departmentLeaves.length > 0) {
        aiClashWarning = {
          hasClash: true,
          clashingWith: departmentLeaves.map((l) => `${l.employeeName} (${l.department})`),
          coverageRatio: 'Staffing overlap detected during selected dates',
          severity: 'ATTENTION',
        };
      }

      const newLeave = {
        id: `LEV-${Math.floor(8800 + Math.random() * 1000)}`,
        employeeId,
        employeeName: emp.name,
        department: emp.department,
        leaveType,
        startDate,
        endDate,
        daysCount: Number(daysCount),
        reason,
        status: 'PENDING',
        appliedDate: new Date().toISOString().split('T')[0],
        reviewedBy: null,
        reviewedAt: null,
        comments: null,
        aiClashWarning,
      };

      db.leaves.unshift(newLeave);

      // Add timeline event
      db.timeline.unshift({
        id: `EVT-${Date.now()}`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        title: `Leave request submitted by ${emp.name}`,
        type: 'LEAVE',
        description: `Applied for ${daysCount} day(s) ${leaveType} leave (${startDate} to ${endDate})`,
        badge: 'Leave Applied',
        color: 'purple',
      });

      // Add notification for HR
      db.notifications.unshift({
        id: `NOTIF-${Date.now()}`,
        title: 'New Leave Request Submitted',
        message: `${emp.name} requested ${daysCount} day(s) of ${leaveType} leave.`,
        category: 'LEAVE',
        read: false,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        link: '/leaves',
      });

      localDB.save(db);
      return newLeave;
    }
  },

  approveLeave: async (leaveId, reviewerName = 'Sarah Connor', comments = '') => {
    try {
      const res = await apiClient.post(`/leaves/${leaveId}/approve`, { reviewerName, comments });
      return res.data;
    } catch {
      const db = localDB.get();
      const leave = db.leaves.find((l) => l.id === leaveId);
      if (!leave) throw new Error('Leave request not found');

      leave.status = 'APPROVED';
      leave.reviewedBy = reviewerName;
      leave.reviewedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
      leave.comments = comments || 'Approved after review.';

      // Deduct balance from employee
      const emp = db.employees.find((e) => e.id === leave.employeeId);
      if (emp && emp.leaveBalances[leave.leaveType]) {
        emp.leaveBalances[leave.leaveType].used += leave.daysCount;
        emp.leaveBalances[leave.leaveType].remaining = Math.max(
          0,
          emp.leaveBalances[leave.leaveType].total - emp.leaveBalances[leave.leaveType].used
        );
      }

      // Add audit log
      db.auditLogs.unshift({
        id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
        user: reviewerName,
        role: 'ADMIN',
        action: 'LEAVE_APPROVED',
        entity: `Leave ${leave.id} for ${leave.employeeName}`,
        ipAddress: '192.168.10.45',
        status: 'SUCCESS',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });

      // Add timeline
      db.timeline.unshift({
        id: `EVT-${Date.now()}`,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        title: `Leave request approved for ${leave.employeeName}`,
        type: 'LEAVE',
        description: `Approved by ${reviewerName} (${leave.daysCount} days)`,
        badge: 'Leave Approved',
        color: 'emerald',
      });

      localDB.save(db);
      return leave;
    }
  },

  rejectLeave: async (leaveId, reviewerName = 'Sarah Connor', comments = '') => {
    try {
      const res = await apiClient.post(`/leaves/${leaveId}/reject`, { reviewerName, comments });
      return res.data;
    } catch {
      const db = localDB.get();
      const leave = db.leaves.find((l) => l.id === leaveId);
      if (!leave) throw new Error('Leave request not found');

      leave.status = 'REJECTED';
      leave.reviewedBy = reviewerName;
      leave.reviewedAt = new Date().toISOString().replace('T', ' ').substring(0, 16);
      leave.comments = comments || 'Request declined due to operational constraints.';

      // Add audit log
      db.auditLogs.unshift({
        id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
        user: reviewerName,
        role: 'ADMIN',
        action: 'LEAVE_REJECTED',
        entity: `Leave ${leave.id} for ${leave.employeeName}`,
        ipAddress: '192.168.10.45',
        status: 'SUCCESS',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });

      localDB.save(db);
      return leave;
    }
  },
};
