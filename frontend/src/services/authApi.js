import { apiClient, localDB } from './apiClient';

export const authApi = {
  login: async ({ email, password }) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data?.token) {
        localStorage.setItem('dayflow_token', response.data.token);
      }
      return response.data;
    } catch {
      // Offline / Local Simulation Fallback
      const db = localDB.get();
      const user = db.employees.find((e) => e.email.toLowerCase() === email.toLowerCase());
      if (user) {
        const token = `mock-jwt-token-${user.id}-${Date.now()}`;
        localStorage.setItem('dayflow_token', token);
        return {
          token,
          user,
          message: 'Login successful (Interactive Mode)',
        };
      }
      throw new Error('Invalid email or password. Please verify your credentials.');
    }
  },

  signup: async (userData) => {
    try {
      const response = await apiClient.post('/auth/signup', userData);
      return response.data;
    } catch {
      const db = localDB.get();
      const existing = db.employees.find((e) => e.email.toLowerCase() === userData.email.toLowerCase());
      if (existing) {
        throw new Error('An account with this email already exists.');
      }
      const newEmpId = `EMP-${1000 + db.employees.length + 1}`;
      const newEmployee = {
        id: newEmpId,
        name: userData.name,
        email: userData.email,
        role: userData.role || 'EMPLOYEE',
        department: userData.department || 'Engineering',
        designation: userData.designation || 'Software Engineer',
        status: 'Active',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        phone: userData.phone || '+1 (555) 000-1122',
        location: 'San Francisco HQ',
        joiningDate: new Date().toISOString().split('T')[0],
        employmentType: 'Full-Time',
        manager: 'Sarah Connor',
        emergencyContact: {
          name: 'Primary Contact',
          relation: 'Family',
          phone: '+1 (555) 999-0000',
        },
        salary: {
          basic: 6500,
          hra: 1800,
          allowances: 1000,
          deductions: { pf: 780, tax: 1500, insurance: 200 },
          netSalary: 6820,
          effectiveDate: new Date().toISOString().split('T')[0],
          currency: 'USD',
        },
        leaveBalances: {
          PAID: { total: 18, used: 0, remaining: 18 },
          SICK: { total: 10, used: 0, remaining: 10 },
          CASUAL: { total: 6, used: 0, remaining: 6 },
          MATERNITY_PATERNITY: { total: 60, used: 0, remaining: 60 },
        },
      };

      db.employees.push(newEmployee);
      localDB.save(db);

      const token = `mock-jwt-token-${newEmployee.id}-${Date.now()}`;
      localStorage.setItem('dayflow_token', token);
      return {
        token,
        user: newEmployee,
        message: 'Account created successfully!',
      };
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth/me');
      return response.data;
    } catch {
      const db = localDB.get();
      const currentUserId = localStorage.getItem('dayflow_user_id') || 'EMP-1001';
      const user = db.employees.find((e) => e.id === currentUserId) || db.employees[0];
      return user;
    }
  },

  logout: async () => {
    localStorage.removeItem('dayflow_token');
    return { success: true };
  },
};
