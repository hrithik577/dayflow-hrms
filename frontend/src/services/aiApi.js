import { apiClient, localDB } from './apiClient';

export const aiApi = {
  getInsights: async () => {
    try {
      const res = await apiClient.get('/ai/insights');
      return res.data;
    } catch {
      const db = localDB.get();
      return db.insights;
    }
  },

  dismissInsight: async (insightId) => {
    try {
      const res = await apiClient.post(`/ai/insights/${insightId}/dismiss`);
      return res.data;
    } catch {
      const db = localDB.get();
      db.insights = db.insights.filter((i) => i.id !== insightId);
      localDB.save(db);
      return { success: true };
    }
  },

  approveInsightAction: async (insightId) => {
    try {
      const res = await apiClient.post(`/ai/insights/${insightId}/approve-action`);
      return res.data;
    } catch {
      const db = localDB.get();
      const ins = db.insights.find((i) => i.id === insightId);
      if (ins) {
        ins.approvalState = 'APPROVED';
        localDB.save(db);
      }
      return ins;
    }
  },

  queryCopilot: async ({ question, userRole = 'ADMIN', userId = 'EMP-1001' }) => {
    try {
      const res = await apiClient.post('/ai/copilot', { question, userRole, userId });
      return res.data;
    } catch {
      const db = localDB.get();
      const q = question.toLowerCase().trim();

      // Check for security guardrail triggers (e.g. Employee asking for others' payroll or org secrets)
      if (
        userRole === 'EMPLOYEE' &&
        (q.includes('salary') || q.includes('payroll') || q.includes('compensation') || q.includes('earn') || q.includes('who earns')) &&
        !q.includes('my salary') &&
        !q.includes('my payroll')
      ) {
        // Record security block in audit log
        db.auditLogs.unshift({
          id: `AUD-${Math.floor(5000 + Math.random() * 4000)}`,
          user: userId,
          role: userRole,
          action: 'AI_SECURITY_BLOCK',
          entity: `Unauthorized AI Query: "${question}"`,
          ipAddress: '72.134.88.19',
          status: 'BLOCKED_BY_GUARDRAIL',
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        });
        localDB.save(db);

        return {
          blocked: true,
          title: 'REQUEST BLOCKED',
          message: 'Employees may only access their own personal payroll and attendance information.',
          reason: 'Permission restricted by role-based access control (RBAC: EMPLOYEE).',
          securityEventId: `SEC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: new Date().toLocaleTimeString(),
        };
      }

      // 1. Who is absent today?
      if (q.includes('absent') || q.includes('who is absent')) {
        const absentees = db.attendance.filter((a) => a.status === 'ABSENT' || a.status === 'ON_LEAVE');
        return {
          blocked: false,
          answer: `Currently, 2 employees are not present at work today:\n• **David Kim** (Sales & Marketing) — Approved Casual Leave\n• **Elena Rostova** (Engineering) — Unlogged Absence (Remote flag check required)`,
          evidence: [
            { metric: 'David Kim', status: 'ON_LEAVE', detail: 'Approved single day casual leave (LEV-8802)' },
            { metric: 'Elena Rostova', status: 'ABSENT', detail: 'Zero check-in punch registered as of 09:30 AM' },
          ],
          dataSources: ['attendance_daily_log_v1', 'leave_requests_db'],
          confidence: 99,
          action: { label: 'View Attendance Roster', link: '/attendance' },
        };
      }

      // 2. Which department has highest late rate?
      if (q.includes('highest late rate') || q.includes('late') || q.includes('late rate')) {
        return {
          blocked: false,
          answer: `**Product & Design** and **Human Resources** have the highest late check-in frequency this week, with **Michael Vance** and **Priya Sharma** clocking in past 9:10 AM today.`,
          evidence: [
            { metric: 'Product & Design', lateCount: 1, rate: '50% of department' },
            { metric: 'Human Resources', lateCount: 1, rate: '50% of department' },
            { metric: 'Engineering', lateCount: 0, rate: '0% (On Time)' },
          ],
          dataSources: ['attendance_telemetry_stream', 'biometric_terminals_sf'],
          confidence: 94,
          action: { label: 'Review Punctuality Analytics', link: '/attendance' },
        };
      }

      // 3. How many employees on leave / leave requests?
      if (q.includes('how many employees are on leave') || q.includes('on leave') || q.includes('leave requests need attention')) {
        const pending = db.leaves.filter((l) => l.status === 'PENDING');
        return {
          blocked: false,
          answer: `There is **1 employee on leave today** (David Kim) and **${pending.length} pending leave requests** requiring urgent HR manager review.`,
          evidence: pending.map((p) => ({
            metric: `${p.employeeName} (${p.department})`,
            dates: `${p.startDate} to ${p.endDate} (${p.daysCount} days)`,
            warning: p.aiClashWarning ? 'Coverage Clash Alert' : 'Normal',
          })),
          dataSources: ['leave_pipeline_db', 'staffing_matrix_v2'],
          confidence: 98,
          action: { label: 'Go to Leave Approvals', link: '/leaves' },
        };
      }

      // 4. Why did Engineering attendance decline?
      if (q.includes('engineering') || q.includes('decline') || q.includes('unusual attendance')) {
        return {
          blocked: false,
          answer: `Engineering presence registered a temporary dip due to overlapping conference travel and upcoming scheduled PTO by Alex Morgan and Elena Rostova. Core infrastructure reliability requires at least one lead engineer on standby.`,
          evidence: [
            { metric: 'Sprint Release v4.2', detail: 'August 28–29 Release Window' },
            { metric: 'Simultaneous PTO', detail: 'Alex Morgan (Cloud) & Elena Rostova (Backend)' },
            { metric: 'Capacity Deficit', detail: '50% reduction in tier-1 incident responders' },
          ],
          dataSources: ['sprint_milestones_api', 'hr_leave_forecast_model'],
          confidence: 93,
          action: { label: 'Open AI Workforce Insights', link: '/ai-insights' },
        };
      }

      // 5. Staffing pressure
      if (q.includes('staffing') || q.includes('pressure') || q.includes('burnout')) {
        return {
          blocked: false,
          answer: `Staffing pressure is elevated in **Engineering** due to simultaneous leave submissions during the scheduled release freeze, and in **Sales & Marketing** during European market close hours.`,
          evidence: [
            { metric: 'Engineering Department', risk: 'High', reason: 'Release freeze overlap' },
            { metric: 'Sales & Marketing', risk: 'Medium', reason: 'Friday afternoon coverage dip' },
          ],
          dataSources: ['workforce_health_analyzer', 'org_headcount_db'],
          confidence: 91,
          action: { label: 'View Command Center', link: '/dashboard' },
        };
      }

      // Default contextual response
      return {
        blocked: false,
        answer: `I analyzed our workforce records across 7 employees, 5 departments, attendance telemetries, and leave pipelines. The overall organization attendance rate today is **86%**, with **2 pending leave requests** awaiting approval.`,
        evidence: [
          { metric: 'Total Active Headcount', value: `${db.employees.length} Staff Members` },
          { metric: 'Attendance Rate Today', value: '86% Present' },
          { metric: 'Active AI Attention Signals', value: '2 High-Priority Signals' },
        ],
        dataSources: ['dayflow_core_telemetry', 'workforce_intelligence_v1'],
        confidence: 95,
        action: { label: 'View Organization Directory', link: '/employees' },
      };
    }
  },
};
