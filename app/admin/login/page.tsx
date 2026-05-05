'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push('/admin');
      router.refresh();
    } else {
      setError('Incorrect password');
      setLoading(false);
    }
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
          <span className="text-[17px] font-extrabold text-[#1A1A1A] leading-snug">
            Onboarding Compass
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E5E2DC] p-6 space-y-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
            Admin sign in
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Container-label input */}
            <div className="bg-white rounded-2xl border border-[#E5E2DC] px-5 py-4 space-y-1 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-[#1A1A1A] text-base placeholder-gray-300 focus:outline-none bg-transparent"
                placeholder="Enter password…"
                autoFocus
                required
              />
            </div>

            {error && (
              <p className="text-xs text-red-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors text-base flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Signing in…
                </>
              ) : 'Sign in →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
