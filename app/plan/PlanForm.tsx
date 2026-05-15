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

const STEPS = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="3" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M5 7h8M5 10h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    label: 'You fill in customer details',
    note: 'Org name, email, API key, region',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 2v4M9 12v4M2 9h4M12 9h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    label: 'Compass fetches their account',
    note: 'Categories, statuses, workflows, checklists',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M3 9l4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    label: 'Customer gets a unique link',
    note: 'They complete the wizard at their own pace',
  },
];

export default function PlanForm({ saEmail }: { saEmail: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ token: string; orgName: string; customerEmail: string } | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const [form, setForm] = useState({
    org_name: '',
    customer_email: '',
    sa_email: saEmail,
    zuper_api_key: '',
    dc_region: 'us-east-1',
    has_zuper_connect: false,
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

    setCreated({
      token: data.session.unique_token,
      orgName: form.org_name,
      customerEmail: form.customer_email,
    });
    setEmailSent(true); // invite email is sent automatically by the API
    setLoading(false);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const customerLink = created ? `${appUrl}/w/${created.token}` : '';

  if (created) {
    return (
      <div className="max-w-[520px] mx-auto space-y-5">
        {/* Success banner */}
        <div className="bg-white rounded-2xl border border-[#E5E2DC] p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-[#F0FDF4] border border-green-200 flex items-center justify-center shrink-0 mt-0.5">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 9l3.5 3.5 6.5-7" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p className="text-base font-bold text-[#1A1A1A] leading-snug">
                {created.orgName} is set up
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                Account snapshot is fetching in the background.
                {emailSent && ' Invite email sent to the customer.'}
              </p>
            </div>
          </div>

          {/* Link */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
              Customer wizard link
            </p>
            <div className="bg-[#FAF9F7] rounded-xl border border-[#E5E2DC] px-4 py-3 flex items-center gap-3">
              <span className="text-xs font-mono text-gray-500 flex-1 truncate">{customerLink}</span>
              <CopyButton text={customerLink} label="Copy" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => {
                setCreated(null);
                setEmailSent(false);
                setForm({
                  org_name: '',
                  customer_email: '',
                  sa_email: form.sa_email,
                  zuper_api_key: '',
                  dc_region: form.dc_region,
                  has_zuper_connect: false,
                });
              }}
              className="flex-1 h-11 border border-[#E5E2DC] text-gray-600 font-semibold rounded-full hover:bg-gray-50 transition-colors text-sm"
            >
              New customer
            </button>
            <Link
              href="/admin"
              className="flex-1 h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-full transition-colors text-sm flex items-center justify-center"
            >
              Go to dashboard
            </Link>
          </div>
        </div>

        {/* What happens next */}
        <div className="bg-white rounded-2xl border border-[#E5E2DC] p-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-4">
            What happens next
          </p>
          <ol className="space-y-4">
            <NextStep
              n={1}
              label="Send the customer their link"
              note="Share the wizard link above directly, or confirm they received the invite email."
            />
            <NextStep
              n={2}
              label="Customer completes the wizard"
              note="Takes about 10 minutes. They answer questions, review their account config, and submit requests."
            />
            <NextStep
              n={3}
              label="You get a summary email"
              note={`Sent to ${form.sa_email} with their answers, change requests, and a PDF report.`}
            />
            <NextStep
              n={4}
              label="Configure and go live"
              note="Use the admin panel to review their answers and change requests, then configure the account before go-live."
            />
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dark hero card */}
      <div className="bg-[#1A1A1A] rounded-2xl p-8 relative overflow-hidden">
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 32px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 32px)',
          }}
        />
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-widest text-orange-400 mb-3">
            New customer
          </p>
          <h1 className="text-[30px] font-extrabold text-white leading-tight">
            Set up a customer session
          </h1>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-[460px]">
            Fill in the details below. Compass fetches the customer&apos;s live Zuper account and generates a unique onboarding link.
          </p>

          {/* Steps — horizontal inside dark card */}
          <div className="mt-7 flex items-start gap-0">
            {STEPS.map((step, i) => (
              <div key={i} className="flex items-start flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-gray-300 shrink-0">
                    {step.icon}
                  </div>
                  <p className="text-xs font-semibold text-white mt-2 text-center leading-snug px-2">
                    {step.label}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 text-center px-2 leading-snug">
                    {step.note}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="w-6 shrink-0 mt-4 border-t border-dashed border-white/20" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Customer details */}
        <fieldset className="space-y-3">
          <legend className="text-[11px] font-bold uppercase tracking-widest text-gray-400 pb-2 flex items-center gap-3 w-full">
            <span>Customer details</span>
            <span className="flex-1 border-t border-[#E5E2DC]" />
          </legend>
          <Field
            label="Organisation name"
            value={form.org_name}
            onChange={(v) => update('org_name', v)}
            placeholder="Summit Roofing Co."
            required
          />
          <Field
            label="Customer email"
            value={form.customer_email}
            onChange={(v) => update('customer_email', v)}
            placeholder="owner@summitroofing.com"
            type="email"
            required
          />
        </fieldset>

        {/* Zuper account */}
        <fieldset className="space-y-3">
          <legend className="text-[11px] font-bold uppercase tracking-widest text-gray-400 pb-2 flex items-center gap-3 w-full">
            <span>Zuper account</span>
            <span className="flex-1 border-t border-[#E5E2DC]" />
          </legend>
          <Field
            label="API key"
            value={form.zuper_api_key}
            onChange={(v) => update('zuper_api_key', v)}
            placeholder="Paste the customer's Zuper API key"
            type="password"
            required
          />
          <div className="bg-white rounded-2xl border border-[#E5E2DC] px-5 py-4 space-y-1 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
              DC region
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

          {/* Zuper Connect toggle */}
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, has_zuper_connect: !f.has_zuper_connect }))}
            className="w-full bg-white rounded-2xl border border-[#E5E2DC] px-5 py-4 flex items-center justify-between gap-4 hover:border-gray-300 transition-colors text-left"
          >
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                Zuper Connect
              </p>
              <p className="text-sm font-semibold text-[#1A1A1A]">
                {form.has_zuper_connect ? 'Customer has Zuper Connect' : 'Customer does not have Zuper Connect'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                When enabled, the customer will be asked how to set up their Connect number.
              </p>
            </div>
            {/* Toggle pill */}
            <div className={`shrink-0 w-11 h-6 rounded-full transition-colors ${form.has_zuper_connect ? 'bg-orange-500' : 'bg-gray-200'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform ${form.has_zuper_connect ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </button>
        </fieldset>

        {/* Your details */}
        <fieldset className="space-y-3">
          <legend className="text-[11px] font-bold uppercase tracking-widest text-gray-400 pb-2 flex items-center gap-3 w-full">
            <span>Your details</span>
            <span className="flex-1 border-t border-[#E5E2DC]" />
          </legend>
          <Field
            label="Your email (SA / BA)"
            value={form.sa_email}
            onChange={(v) => update('sa_email', v)}
            placeholder="you@zuper.co"
            type="email"
            required
          />
        </fieldset>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-13 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-colors text-base flex items-center justify-center gap-2"
          style={{ height: '52px' }}
        >
          {loading ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Creating session…
            </>
          ) : (
            <>
              Generate customer link
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-400">
          An invite email will be sent to the customer automatically.
        </p>
      </form>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = 'text', required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
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

function NextStep({ n, label, note }: { n: number; label: string; note: string }) {
  return (
    <li className="flex items-start gap-4">
      <div className="w-6 h-6 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[11px] font-bold text-orange-500">{n}</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-[#1A1A1A]">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{note}</p>
      </div>
    </li>
  );
}
