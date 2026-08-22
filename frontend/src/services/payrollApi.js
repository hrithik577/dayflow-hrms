import { apiClient, localDB } from './apiClient';

export const payrollApi = {
  getMyPayroll: async (employeeId) => {
    try {
      const res = await apiClient.get(`/payroll/me/${employeeId}`);
      return res.data;
    } catch {
      const db = localDB.get();
      const emp = db.employees.find((e) => e.id === employeeId);
      if (!emp) throw new Error('Employee not found');

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        designation: emp.designation,
        department: emp.department,
        salary: emp.salary,
        history: [
          { month: 'July 2026', gross: emp.salary.basic + emp.salary.hra + emp.salary.allowances, net: emp.salary.netSalary, status: 'Paid', date: '2026-07-31' },
          { month: 'June 2026', gross: emp.salary.basic + emp.salary.hra + emp.salary.allowances, net: emp.salary.netSalary, status: 'Paid', date: '2026-06-30' },
          { month: 'May 2026', gross: emp.salary.basic + emp.salary.hra + emp.salary.allowances, net: emp.salary.netSalary, status: 'Paid', date: '2026-05-31' },
        ],
      };
    }
  },

  getCompanyPayroll: async () => {
    try {
      const res = await apiClient.get('/payroll/company');
      return res.data;
    } catch {
      const db = localDB.get();
      let totalGross = 0;
      let totalNet = 0;
      let totalTax = 0;
      let totalPf = 0;

      const departmentBreakdown = {};

      const employeePayrolls = db.employees.map((emp) => {
        const gross = emp.salary.basic + emp.salary.hra + emp.salary.allowances;
        const net = emp.salary.netSalary;
        const tax = emp.salary.deductions.tax;
        const pf = emp.salary.deductions.pf;

        totalGross += gross;
        totalNet += net;
        totalTax += tax;
        totalPf += pf;

        if (!departmentBreakdown[emp.department]) {
          departmentBreakdown[emp.department] = { count: 0, totalNet: 0 };
        }
        departmentBreakdown[emp.department].count += 1;
        departmentBreakdown[emp.department].totalNet += net;

        return {
          id: emp.id,
          name: emp.name,
          department: emp.department,
          designation: emp.designation,
          basic: emp.salary.basic,
          hra: emp.salary.hra,
          allowances: emp.salary.allowances,
          deductions: emp.salary.deductions,
          netSalary: emp.salary.netSalary,
          effectiveDate: emp.salary.effectiveDate,
        };
      });

      return {
        summary: {
          totalGross,
          totalNet,
          totalTax,
          totalPf,
          headcount: db.employees.length,
          avgSalary: Math.round(totalNet / Math.max(1, db.employees.length)),
        },
        departmentBreakdown: Object.keys(departmentBreakdown).map((dept) => ({
          department: dept,
          count: departmentBreakdown[dept].count,
          totalExpense: departmentBreakdown[dept].totalNet,
        })),
        employees: employeePayrolls,
      };
    }
  },

  updateSalary: async (employeeId, salaryData) => {
    try {
      const res = await apiClient.put(`/payroll/${employeeId}`, salaryData);
      return res.data;
    } catch {
      const db = localDB.get();
      const emp = db.employees.find((e) => e.id === employeeId);
      if (!emp) throw new Error('Employee not found');

      const basic = Number(salaryData.basic || emp.salary.basic);
      const hra = Number(salaryData.hra || emp.salary.hra);
      const allowances = Number(salaryData.allowances || emp.salary.allowances);
      const pf = Number(salaryData.pf || Math.round(basic * 0.12));
      const tax = Number(salaryData.tax || Math.round(basic * 0.2));
      const insurance = Number(salaryData.insurance || 300);

      const netSalary = basic + hra + allowances - (pf + tax + insurance);

      emp.salary = {
        basic,
        hra,
        allowances,
        deductions: { pf, tax, insurance },
        netSalary,
        effectiveDate: salaryData.effectiveDate || new Date().toISOString().split('T')[0],
        currency: 'USD',
      };

      // Add audit log
      db.auditLogs.unshift({
        id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
        user: 'Admin',
        role: 'ADMIN',
        action: 'SALARY_STRUCTURE_MODIFIED',
        entity: `Salary updated for ${emp.name} ($${netSalary} Net)`,
        ipAddress: '192.168.10.45',
        status: 'SUCCESS',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });

      localDB.save(db);
      return emp.salary;
    }
  },
};
