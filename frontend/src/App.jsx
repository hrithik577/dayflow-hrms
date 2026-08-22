import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AIChatDrawer } from './components/AIChatDrawer';

// Pages
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { EmployeesPage } from './pages/EmployeesPage';
import { AttendancePage } from './pages/AttendancePage';
import { LeavePage } from './pages/LeavePage';
import { PayrollPage } from './pages/PayrollPage';
import { AICopilotPage } from './pages/AICopilotPage';
import { AIInsightsPage } from './pages/AIInsightsPage';
import { AuditPage } from './pages/AuditPage';
import { ProfilePage } from './pages/ProfilePage';

const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
        Initializing Dayflow Platform...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isHR = user.role === 'HR' || user.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col transition-colors">
      <Navbar
        onOpenAIChat={() => setAiDrawerOpen(true)}
        onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
      />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />
        <main className="flex-1 overflow-y-auto bg-slate-950/40 p-3 sm:p-6 transition-colors">
          <Routes>
            <Route path="/" element={isHR ? <AdminDashboard /> : <EmployeeDashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/employees" element={isHR ? <EmployeesPage /> : <Navigate to="/" replace />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/leave" element={<LeavePage />} />
            <Route path="/payroll" element={<PayrollPage />} />
            <Route path="/ai-copilot" element={<AICopilotPage />} />
            <Route path="/ai-insights" element={<AIInsightsPage />} />
            <Route path="/audit" element={isHR ? <AuditPage /> : <Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      <AIChatDrawer isOpen={aiDrawerOpen} onClose={() => setAiDrawerOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/*" element={<ProtectedLayout />} />
            </Routes>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
