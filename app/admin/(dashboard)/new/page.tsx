'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CopyButton } from '@/components/admin/CopyButton';

const DC_REGIONS = [
  { value: 'us-east-1',      label: 'US East (us-east-1)' },
  { value: 'eu-west-1',      label: 'Europe West (eu-west-1)' },
  { value: 'ap-south-1',     label: 'Asia Pacific South (ap-south-1)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific SE (ap-southeast-1)' },
];

export default function NewSessionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ token: string; orgName: string } | null>(null);

  const [form, setForm] = useState({
    org_name: '',
    customer_email: '',
    sa_email: '',
    zuper_api_key: '',
    dc_region: 'us-east-1',
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/admin/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Failed to create session');
      setLoading(false);
      return;
    }

    setCreated({ token: data.session.unique_token, orgName: form.org_name });
    setLoading(false);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const customerLink = created ? `${appUrl}/w/${created.token}` : '';

  if (created) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
          <div className="flex items-center gap-3 mb-1">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="8" fill="#22C55E"/>
              <path d="M5.5 9l2.5 2.5 4.5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p className="text-sm font-bold text-green-700">Session created for {created.orgName}</p>
          </div>
          <p className="text-xs text-green-600 ml-[30px]">
            Account snapshot is being fetched in the background.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E2DC] p-6 space-y-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Customer link
          </p>
          <div className="bg-[#FAF9F7] rounded-xl border border-[#E5E2DC] px-4 py-3 flex items-center gap-3">
            <span className="text-xs font-mono text-gray-500 flex-1 truncate">{customerLink}</span>
            <CopyButton text={customerLink} label="Copy" />
          </div>

          <div className="flex gap-3 pt-2">
            <Link
              href="/admin"
              className="flex-1 h-11 border border-[#E5E2DC] text-gray-600 font-semibold rounded-full hover:bg-gray-50 transition-colors text-sm flex items-center justify-center"
            >
              ← Dashboard
            </Link>
            <button
              onClick={() => {
                setCreated(null);
                setForm({ org_name: '', customer_email: '', sa_email: form.sa_email, zuper_api_key: '', dc_region: form.dc_region });
              }}
              className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-colors text-sm"
            >
              New session →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin" className="text-gray-400 hover:text-orange-500 transition-colors">
          ← Sessions
        </Link>
      </div>

      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">New</p>
        <h1 className="text-[32px] font-extrabold text-[#1A1A1A] leading-tight">
          Create session
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Customer organisation name" value={form.org_name}    onChange={(v) => update('org_name', v)}        placeholder="Summit Roofing Co." required />
        <Field label="Customer email"              value={form.customer_email} onChange={(v) => update('customer_email', v)} placeholder="owner@summitroofing.com" type="email" required />
        <Field label="SA / BA email"               value={form.sa_email}    onChange={(v) => update('sa_email', v)}        placeholder="sa@zuper.co" type="email" required />
        <Field label="Zuper API key"               value={form.zuper_api_key} onChange={(v) => update('zuper_api_key', v)} placeholder="Paste the customer's API key" type="password" required />

        {/* DC Region — container-label select */}
        <div className="bg-white rounded-2xl border border-[#E5E2DC] px-5 py-4 space-y-1 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
            DC Region
          </label>
          <select
            value={form.dc_region}
            onChange={(e) => update('dc_region', e.target.value)}
            className="w-full text-[#1A1A1A] text-base focus:outline-none bg-transparent"
          >
            {DC_REGIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors text-base flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Creating…
              </>
            ) : 'Create session →'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = 'text', required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E2DC] px-5 py-4 space-y-1 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full text-[#1A1A1A] text-base placeholder-gray-300 focus:outline-none bg-transparent"
      />
    </div>
  );
}
