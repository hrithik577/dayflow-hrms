import { apiClient, localDB } from './apiClient';

export const employeeApi = {
  getAll: async (params = {}) => {
    try {
      const res = await apiClient.get('/employees', { params });
      return res.data;
    } catch {
      const db = localDB.get();
      let list = [...db.employees];
      if (params.department && params.department !== 'All Departments') {
        list = list.filter((e) => e.department === params.department);
      }
      if (params.role) {
        list = list.filter((e) => e.role === params.role);
      }
      if (params.status) {
        list = list.filter((e) => e.status === params.status);
      }
      if (params.search) {
        const query = params.search.toLowerCase();
        list = list.filter(
          (e) =>
            e.name.toLowerCase().includes(query) ||
            e.email.toLowerCase().includes(query) ||
            e.id.toLowerCase().includes(query) ||
            e.designation.toLowerCase().includes(query)
        );
      }
      return list;
    }
  },

  getById: async (id) => {
    try {
      const res = await apiClient.get(`/employees/${id}`);
      return res.data;
    } catch {
      const db = localDB.get();
      const emp = db.employees.find((e) => e.id === id);
      if (!emp) throw new Error('Employee not found');
      return emp;
    }
  },

  create: async (employeeData) => {
    try {
      const res = await apiClient.post('/employees', employeeData);
      return res.data;
    } catch {
      const db = localDB.get();
      const newId = `EMP-${1000 + db.employees.length + 1}`;
      const newEmployee = {
        id: newId,
        status: 'Active',
        avatar: employeeData.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
        joiningDate: employeeData.joiningDate || new Date().toISOString().split('T')[0],
        employmentType: 'Full-Time',
        leaveBalances: {
          PAID: { total: 18, used: 0, remaining: 18 },
          SICK: { total: 10, used: 0, remaining: 10 },
          CASUAL: { total: 6, used: 0, remaining: 6 },
          MATERNITY_PATERNITY: { total: 60, used: 0, remaining: 60 },
        },
        salary: employeeData.salary || {
          basic: 7000,
          hra: 2000,
          allowances: 1000,
          deductions: { pf: 840, tax: 1600, insurance: 250 },
          netSalary: 7310,
          effectiveDate: new Date().toISOString().split('T')[0],
          currency: 'USD',
        },
        emergencyContact: employeeData.emergencyContact || {
          name: 'Contact',
          relation: 'Family',
          phone: '+1 (555) 000-0000',
        },
        ...employeeData,
      };

      db.employees.unshift(newEmployee);

      // Add audit log
      db.auditLogs.unshift({
        id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
        user: 'Admin',
        role: 'ADMIN',
        action: 'EMPLOYEE_ONBOARDED',
        entity: `${newEmployee.name} (${newEmployee.id})`,
        ipAddress: '192.168.10.45',
        status: 'SUCCESS',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });

      localDB.save(db);
      return newEmployee;
    }
  },

  update: async (id, updates) => {
    try {
      const res = await apiClient.put(`/employees/${id}`, updates);
      return res.data;
    } catch {
      const db = localDB.get();
      const index = db.employees.findIndex((e) => e.id === id);
      if (index === -1) throw new Error('Employee not found');

      db.employees[index] = {
        ...db.employees[index],
        ...updates,
      };

      // Add audit log
      db.auditLogs.unshift({
        id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
        user: 'HR/Admin',
        role: 'ADMIN',
        action: 'EMPLOYEE_PROFILE_UPDATED',
        entity: `${db.employees[index].name} (${id})`,
        ipAddress: '192.168.10.45',
        status: 'SUCCESS',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });

      localDB.save(db);
      return db.employees[index];
    }
  },

  delete: async (id) => {
    try {
      const res = await apiClient.delete(`/employees/${id}`);
      return res.data;
    } catch {
      const db = localDB.get();
      db.employees = db.employees.filter((e) => e.id !== id);
      localDB.save(db);
      return { success: true, message: 'Employee deleted' };
    }
  },
};
