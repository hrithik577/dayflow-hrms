import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import EmployeeListPage from './pages/employees/EmployeeListPage';
import AttendancePage from './pages/attendance/AttendancePage';
import LeaveManagementPage from './pages/leaves/LeaveManagementPage';
import PayrollPage from './pages/payroll/PayrollPage';
import AIInsightsPage from './pages/ai-insights/AIInsightsPage';
import AICopilotPage from './pages/ai-copilot/AICopilotPage';
import TimelinePage from './pages/timeline/TimelinePage';
import AuditLogsPage from './pages/audit/AuditLogsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected Enterprise App Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/employees" element={<EmployeeListPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/leaves" element={<LeaveManagementPage />} />
                <Route path="/leave" element={<Navigate to="/leaves" replace />} />
                <Route path="/payroll" element={<PayrollPage />} />
                <Route path="/ai-insights" element={<AIInsightsPage />} />
                <Route path="/ai-copilot" element={<AICopilotPage />} />
                <Route path="/timeline" element={<TimelinePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />

                {/* Role-Restricted Admin Routes */}
                <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'HR']} />}>
                  <Route path="/audit" element={<AuditLogsPage />} />
                </Route>
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
