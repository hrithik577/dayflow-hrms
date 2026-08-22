import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Sparkles, Shield, User, UserCheck } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-extrabold text-2xl shadow-xl shadow-blue-600/30 mb-2">
            D
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">DAYFLOW</h1>
          <p className="text-xs text-slate-400 font-medium">Every workday, perfectly aligned.</p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-8 shadow-2xl border border-slate-800">
          <h2 className="text-lg font-bold text-slate-100 mb-6 flex items-center gap-2">
            <LogIn className="w-5 h-5 text-blue-400" />
            Sign in to Platform
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@dayflow.com"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Hackathon Demo Credentials Auto-Fill */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              1-Click Demo Evaluation Profiles:
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('rahul.sharma@dayflow.com', 'Emp@123')}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-left transition-all group"
              >
                <div className="flex items-center gap-1 text-blue-400 font-bold text-xs">
                  <User className="w-3 h-3" /> Employee
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">Rahul Sharma</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('hr.sarah@dayflow.com', 'HR@123')}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 text-left transition-all group"
              >
                <div className="flex items-center gap-1 text-purple-400 font-bold text-xs">
                  <UserCheck className="w-3 h-3" /> HR Manager
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">Sarah Jenkins</p>
              </button>

              <button
                type="button"
                onClick={() => handleDemoFill('admin@dayflow.com', 'Admin@123')}
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-left transition-all group"
              >
                <div className="flex items-center gap-1 text-amber-400 font-bold text-xs">
                  <Shield className="w-3 h-3" /> Admin
                </div>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">Victor Vance</p>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          Need an account? <Link to="/signup" className="text-blue-400 hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
};
