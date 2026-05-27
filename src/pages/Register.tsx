import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  });
  const [errors, setErrors]     = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw]     = useState(false);
  const [showCp, setShowCp]     = useState(false);

  React.useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const validateForm = (): boolean => {
    const errs: string[] = [];
    if (formData.first_name.trim().length < 2)  errs.push('First name must be at least 2 characters.');
    if (formData.last_name.trim().length < 2)   errs.push('Last name must be at least 2 characters.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errs.push('Please enter a valid email address.');
    if (formData.password.length < 8)           errs.push('Password must be at least 8 characters.');
    if (formData.password !== formData.confirm_password) errs.push('Passwords do not match.');
    setErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const result = await register({
        first_name: formData.first_name,
        last_name:  formData.last_name,
        email:      formData.email,
        phone:      formData.phone,
        password:   formData.password,
      });
      if (result.requiresVerification) {
        navigate(`/verify-email?email=${encodeURIComponent(result.email)}`);
      }
    } catch (err: any) {
      setErrors([err.message || 'Registration failed. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  };

  const field = (
    label: string,
    name: keyof typeof formData,
    type: string,
    placeholder: string,
    Icon: React.ElementType,
    extra?: React.ReactNode,
    hint?: string,
  ) => (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
        {label}
      </label>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-slate-400 pointer-events-none" />
        <input
          type={type}
          required={name !== 'phone'}
          autoComplete={name === 'email' ? 'email' : name === 'password' ? 'new-password' : 'off'}
          value={formData[name]}
          onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 text-sm text-slate-900 placeholder:text-slate-300
                     bg-slate-50 border border-slate-200 rounded-xl
                     focus:outline-none focus:bg-white focus:border-[#003399] focus:ring-2 focus:ring-[#003399]/10
                     transition-all"
        />
        {extra}
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );

  const pwToggle = (show: boolean, toggle: () => void) => (
    <button
      type="button"
      onClick={toggle}
      tabIndex={-1}
      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
    >
      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

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
      <div className="w-full max-w-[480px] bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-300/30 overflow-hidden">

        {/* Brand accent stripe */}
        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, #003399 60%, #E31B23 100%)' }} />

        <div className="px-8 pt-8 pb-9">

          {/* Heading */}
          <div className="mb-7">
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Create your account</h1>
            <p className="text-slate-400 text-sm mt-1.5">Join Biostec Group — it only takes a minute</p>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl space-y-1">
              {errors.map((e, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <p className="text-sm text-red-700 leading-snug">{e}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              {field('First name', 'first_name', 'text', 'John',  User)}
              {field('Last name',  'last_name',  'text', 'Doe',   User)}
            </div>

            {/* Email */}
            {field('Email address', 'email', 'email', 'you@example.com', Mail)}

            {/* Phone */}
            {field('Phone number', 'phone', 'tel', '+27 61 234 5678', Phone)}

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-slate-400 pointer-events-none" />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min. 8 characters"
                  className="w-full pl-10 pr-11 py-3 text-sm text-slate-900 placeholder:text-slate-300
                             bg-slate-50 border border-slate-200 rounded-xl
                             focus:outline-none focus:bg-white focus:border-[#003399] focus:ring-2 focus:ring-[#003399]/10
                             transition-all"
                />
                {pwToggle(showPw, () => setShowPw(!showPw))}
              </div>
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-slate-400 pointer-events-none" />
                <input
                  type={showCp ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  placeholder="Repeat your password"
                  className="w-full pl-10 pr-11 py-3 text-sm text-slate-900 placeholder:text-slate-300
                             bg-slate-50 border border-slate-200 rounded-xl
                             focus:outline-none focus:bg-white focus:border-[#003399] focus:ring-2 focus:ring-[#003399]/10
                             transition-all"
                />
                {pwToggle(showCp, () => setShowCp(!showCp))}
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                required
                className="mt-0.5 w-4 h-4 rounded border-slate-300 accent-[#003399] shrink-0 cursor-pointer"
              />
              <span className="text-sm text-slate-500 leading-snug">
                I agree to the{' '}
                <Link to="/terms" className="text-[#003399] font-semibold hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-[#003399] font-semibold hover:underline">Privacy Policy</Link>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white
                         flex items-center justify-center gap-2
                         transition-all active:scale-[0.98]
                         disabled:opacity-60 disabled:cursor-not-allowed
                         hover:brightness-110"
              style={{ backgroundColor: '#003399' }}
            >
              {isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
                : 'Create Account'
              }
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Switch to login */}
          <p className="text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[#003399] hover:underline">
              Sign in
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
