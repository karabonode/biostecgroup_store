import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, isAdmin } = useAuth();
  const [formData, setFormData]   = useState({ email: '', password: '' });
  const [error, setError]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw]       = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect');
      navigate(redirect === 'checkout' ? '/checkout' : isAdmin ? '/admin' : '/');
    }
  }, [isAuthenticated, isAdmin, navigate, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
    } catch (err: any) {
      if (err.requiresVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(err.email || formData.email)}`);
        return;
      }
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(160deg, #f5f7fc 0%, #edf0f7 100%)' }}
    >
      {/* Logo */}
      <Link to="/" className="mb-8 block">
        <img src="/logo.png" alt="Biostec Group" className="h-11 w-auto mx-auto" />
      </Link>

      {/* Card */}
      <div className="w-full max-w-[420px] bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-300/30 overflow-hidden">

        {/* Brand accent stripe */}
        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #003399 60%, #E31B23 100%)' }} />

        <div className="px-8 pt-8 pb-9">

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Sign in to your account</h1>
            <p className="text-slate-400 text-sm mt-1.5">Enter your credentials to continue</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              <p className="text-sm text-red-700 leading-snug">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-300
                             bg-slate-50 border border-slate-200 rounded-xl
                             focus:outline-none focus:bg-white focus:border-[#003399] focus:ring-2 focus:ring-[#003399]/10
                             transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs font-semibold text-[#003399] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-slate-400 pointer-events-none" />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 text-sm text-slate-900 placeholder:text-slate-300
                             bg-slate-50 border border-slate-200 rounded-xl
                             focus:outline-none focus:bg-white focus:border-[#003399] focus:ring-2 focus:ring-[#003399]/10
                             transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-1 py-3.5 rounded-xl text-sm font-semibold text-white
                         flex items-center justify-center gap-2
                         transition-all active:scale-[0.98]
                         disabled:opacity-60 disabled:cursor-not-allowed
                         hover:brightness-110"
              style={{ backgroundColor: '#003399' }}
            >
              {isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
                : 'Sign In'
              }
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Switch to register */}
          <p className="text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#003399] hover:underline">
              Create one free
            </Link>
          </p>

        </div>
      </div>

      {/* Back link */}
      <Link to="/" className="mt-7 text-xs text-slate-400 hover:text-slate-600 transition-colors">
        ← Back to store
      </Link>
    </div>
  );
}
