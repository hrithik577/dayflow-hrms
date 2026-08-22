import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/authApi';
import { localDB } from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize active user
  useEffect(() => {
    async function initUser() {
      try {
        const db = localDB.get();
        const storedId = localStorage.getItem('dayflow_user_id') || 'EMP-1001';
        const found = db.employees.find((e) => e.id === storedId) || db.employees[0];
        setUser(found);
      } catch (err) {
        console.error('Failed to load user', err);
      } finally {
        setLoading(false);
      }
    }
    initUser();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await authApi.login({ email, password });
      setUser(res.user);
      localStorage.setItem('dayflow_user_id', res.user.id);
      return res.user;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const signup = async (userData) => {
    setError(null);
    try {
      const res = await authApi.signup(userData);
      setUser(res.user);
      localStorage.setItem('dayflow_user_id', res.user.id);
      return res.user;
    } catch (err) {
      setError(err.message || 'Signup failed');
      throw err;
    }
  };

  const logout = async () => {
    await authApi.logout();
    const db = localDB.get();
    // Default back to Alex Morgan (Employee) or null
    setUser(null);
    localStorage.removeItem('dayflow_user_id');
  };

  // One-click persona switcher for evaluators and pair debugging
  const switchUser = (employeeId) => {
    const db = localDB.get();
    const target = db.employees.find((e) => e.id === employeeId);
    if (target) {
      setUser(target);
      localStorage.setItem('dayflow_user_id', target.id);
    }
  };

  const updateUserProfile = (updatedData) => {
    const db = localDB.get();
    const index = db.employees.findIndex((e) => e.id === user.id);
    if (index !== -1) {
      db.employees[index] = { ...db.employees[index], ...updatedData };
      localDB.save(db);
      setUser(db.employees[index]);
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const isHR = user?.role === 'HR';
  const isEmployee = user?.role === 'EMPLOYEE';
  const isManagement = isAdmin || isHR;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        signup,
        logout,
        switchUser,
        updateUserProfile,
        isAdmin,
        isHR,
        isEmployee,
        isManagement,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
