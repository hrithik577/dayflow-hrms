import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import SecurityBlockBanner from './SecurityBlockBanner';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="h-8 w-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles required and user does not match
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <SecurityBlockBanner
          title="ACCESS RESTRICTED (403)"
          message={`You are currently signed in with role [${user.role}]. This administrative screen is restricted to [${allowedRoles.join(', ')}].`}
          reason="RBAC authorization failure. Access denied by enterprise policy."
          securityEventId={`SEC-RBAC-${Date.now().toString().slice(-4)}`}
          timestamp={new Date().toLocaleTimeString()}
        />
      </div>
    );
  }

  return <Outlet />;
}
