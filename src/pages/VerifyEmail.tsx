import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { Mail, Loader2, RefreshCw, CheckCircle } from 'lucide-react';

const RESEND_COOLDOWN = 60;

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const email = decodeURIComponent(searchParams.get('email') ?? '');

  const [digits, setDigits]         = useState<string[]>(Array(6).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError]           = useState('');
  const [cooldown, setCooldown]     = useState(RESEND_COOLDOWN);
  const [isSending, setIsSending]   = useState(false);
  const [resendMsg, setResendMsg]   = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) navigate('/register');
  }, [email, navigate]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const focusBox = (index: number) => inputRefs.current[index]?.focus();

  const handleDigitChange = (index: number, value: string) => {
    // Accept only digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');
    if (digit && index < 5) focusBox(index + 1);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) focusBox(index - 1);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = Array(6).fill('');
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    setError('');
    focusBox(Math.min(pasted.length, 5));
  };

  const otp = digits.join('');

  const handleVerify = useCallback(async () => {
    if (otp.length !== 6) { setError('Please enter the full 6-digit code.'); return; }
    setIsVerifying(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        if (data.expired) {
          setError('Code expired. Please request a new one below.');
        } else {
          setError(data.error || 'Verification failed. Please try again.');
        }
        setDigits(Array(6).fill(''));
        setTimeout(() => focusBox(0), 50);
        return;
      }
      // Store token and user, then redirect
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      // Force a page reload so AuthContext re-hydrates from localStorage
      window.location.href = '/';
    } catch {
      setError('Connection error. Please check your internet and try again.');
    } finally {
      setIsVerifying(false);
    }
  }, [email, otp]);

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    if (otp.length === 6 && !otp.includes('') && !isVerifying) {
      handleVerify();
    }
  }, [otp, isVerifying, handleVerify]);

  const handleResend = async () => {
    if (cooldown > 0 || isSending) return;
    setIsSending(true);
    setResendMsg('');
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/resend-otp.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        if (data.retry_after) {
          setCooldown(data.retry_after);
          setError(`Please wait ${data.retry_after}s before requesting another code.`);
        } else {
          setError(data.error || 'Could not resend code.');
        }
      } else {
        setResendMsg('A new code was sent to your inbox.');
        setCooldown(RESEND_COOLDOWN);
        setDigits(Array(6).fill(''));
        setTimeout(() => focusBox(0), 50);
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-200">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Check your inbox</h1>
          <p className="text-slate-500 mt-1 text-sm">We sent a 6-digit code to</p>
          <p className="font-semibold text-slate-800 mt-0.5">{email}</p>
          <p className="text-xs text-slate-400 mt-1">Can't find it? Check your spam / junk folder.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {resendMsg && !error && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <p className="text-emerald-700 text-sm">{resendMsg}</p>
            </div>
          )}

          {/* 6-digit input */}
          <div
            className="flex justify-center gap-2 mb-4"
            onPaste={handlePaste}
          >
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                className={`w-11 h-14 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all
                  ${d ? 'border-blue-500 text-blue-700 bg-blue-50 shadow-sm' : 'border-slate-200 text-slate-300 bg-white'}
                  focus:border-blue-500 focus:bg-blue-50 disabled:opacity-40`}
                autoFocus={i === 0}
                disabled={isVerifying}
              />
            ))}
          </div>

          <p className="text-center text-xs text-slate-400 mb-6">
            Expires in 10 minutes &bull; Submits automatically when all 6 digits are entered
          </p>

          <button
            onClick={handleVerify}
            disabled={isVerifying || otp.length !== 6}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700
                       transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying…
              </>
            ) : (
              'Verify Email'
            )}
          </button>

          {/* Resend */}
          <div className="mt-6 text-center">
            {cooldown > 0 ? (
              <p className="text-sm text-slate-400">
                Resend code in <span className="font-semibold text-slate-600">{cooldown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={isSending}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700
                           font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Resend code
              </button>
            )}
          </div>

          <div className="mt-4 text-center space-y-2">
            <button
              onClick={() => navigate('/register')}
              className="text-sm text-slate-400 hover:text-slate-600 block w-full"
            >
              Wrong email? Go back
            </button>
            <p className="text-xs text-slate-300">
              Already verified?{' '}
              <button onClick={() => navigate('/login')} className="text-blue-400 hover:text-blue-600">
                Sign in
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
