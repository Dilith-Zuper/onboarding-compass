'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'email' | 'code';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [nextPath, setNextPath] = useState('/admin');
  const codeInputRef = useRef<HTMLInputElement>(null);

  // Handle ?next=... and magic link params (?email=...&code=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextParam = params.get('next');
    if (nextParam) setNextPath(nextParam);

    const emailParam = params.get('email');
    const codeParam  = params.get('code');
    if (emailParam && codeParam && codeParam.length === 6) {
      setEmail(emailParam);
      setCode(codeParam);
      setStep('code');
      setLoading(true);
      // Auto-verify immediately
      fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email: emailParam, code: codeParam }),
      }).then(async (res) => {
        if (res.ok) {
          router.push(nextParam || '/admin');
          router.refresh();
        } else {
          const d = await res.json();
          setError(d.error || 'Link expired. Request a new code.');
          setLoading(false);
          setCode('');
        }
      }).catch(() => {
        setError('Network error. Please try again.');
        setLoading(false);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start 60s countdown after OTP sent
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCountdown]);

  // Auto-focus code input when step changes
  useEffect(() => {
    if (step === 'code') codeInputRef.current?.focus();
  }, [step]);

  const handleVerify = useCallback(async () => {
    if (code.length < 6) return;
    setLoading(true);
    setError('');

    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'verify', email, code }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Verification failed.');
      setCode('');
      setLoading(false);
      codeInputRef.current?.focus();
      return;
    }

    router.push(nextPath);
    router.refresh();
  }, [code, email, nextPath, router]);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (code.length === 6) handleVerify();
  }, [code, handleVerify]);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request', email }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Something went wrong.');
      setLoading(false);
      return;
    }

    setStep('code');
    setResendCountdown(60);
    setLoading(false);
  }

  async function handleMasterLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'master_login', email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Invalid email or password.');
      setLoading(false);
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  async function handleResend() {
    if (resendCountdown > 0) return;
    setCode('');
    setError('');
    setLoading(true);

    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'request', email }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to resend.');
    } else {
      setResendCountdown(60);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">

        {/* Logo */}
        <div className="flex items-center gap-3 justify-center">
          <div className="w-9 h-9 rounded-xl bg-[#1A1A1A] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <path d="M7 1.5A5.5 5.5 0 1 1 1.5 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M7 4v3l1.5 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-[17px] font-extrabold text-[#1A1A1A]">Onboarding Compass</span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E5E2DC] overflow-hidden">
          <AnimatePresence mode="wait">

            {/* Step 1 — Email */}
            {step === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-6 space-y-5"
              >
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    Admin access
                  </p>
                  <h1 className="text-[22px] font-extrabold text-[#1A1A1A] leading-tight">
                    Sign in to Compass
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Only <span className="font-semibold text-[#1A1A1A]">@zuper.co</span> accounts can sign in.
                  </p>
                </div>

                <form onSubmit={usePassword ? handleMasterLogin : handleRequestOtp} className="space-y-3">
                  <div className="bg-white rounded-2xl border border-[#E5E2DC] px-5 py-4 space-y-1 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Work email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@zuper.co"
                      autoFocus
                      required
                      className="w-full text-[#1A1A1A] text-base placeholder-gray-300 focus:outline-none bg-transparent"
                    />
                  </div>

                  {usePassword && (
                    <div className="bg-white rounded-2xl border border-[#E5E2DC] px-5 py-4 space-y-1 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Password
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full text-[#1A1A1A] text-base placeholder-gray-300 focus:outline-none bg-transparent"
                      />
                    </div>
                  )}

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <p className="text-xs text-red-600">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !email || (usePassword && !password)}
                    className="w-full h-12 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors text-base flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        {usePassword ? 'Signing in…' : 'Sending…'}
                      </>
                    ) : (usePassword ? 'Sign in →' : 'Send code →')}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setUsePassword((v) => !v); setError(''); setPassword(''); }}
                    className="w-full text-center text-xs font-medium text-gray-400 hover:text-orange-500 transition-colors underline underline-offset-2"
                  >
                    {usePassword ? '← Use email code instead' : 'Sign in with a password instead'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Step 2 — OTP code */}
            {step === 'code' && (
              <motion.div
                key="code"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-6 space-y-5"
              >
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    Check your email
                  </p>
                  <h1 className="text-[22px] font-extrabold text-[#1A1A1A] leading-tight">
                    Enter your code
                  </h1>
                  <p className="text-sm text-gray-500 mt-1">
                    We sent a 6-digit code to <span className="font-semibold text-[#1A1A1A]">{email}</span>
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="bg-white rounded-2xl border border-[#E5E2DC] px-5 py-4 space-y-1 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      6-digit code
                    </label>
                    <input
                      ref={codeInputRef}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      className="w-full text-[#1A1A1A] text-2xl font-bold tracking-[0.3em] placeholder-gray-200 focus:outline-none bg-transparent"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <p className="text-xs text-red-600">{error}</p>
                    </div>
                  )}

                  <button
                    onClick={handleVerify}
                    disabled={loading || code.length < 6}
                    className="w-full h-12 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors text-base flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Verifying…
                      </>
                    ) : 'Verify →'}
                  </button>
                </div>

                {/* Resend + back */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => { setStep('email'); setCode(''); setError(''); }}
                    className="text-xs font-medium text-gray-400 hover:text-orange-500 transition-colors underline underline-offset-2"
                  >
                    ← Change email
                  </button>
                  <button
                    onClick={handleResend}
                    disabled={resendCountdown > 0 || loading}
                    className="text-xs font-medium text-gray-400 hover:text-orange-500 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors underline underline-offset-2"
                  >
                    {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend code'}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-gray-400">
          Zuper internal tool — authorised access only
        </p>
      </div>
    </div>
  );
}
