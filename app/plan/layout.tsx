import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import Link from 'next/link';

import { cleanEnv } from '@/lib/utils';
import type { AdminRole } from '@/lib/auth';

const secret = new TextEncoder().encode(cleanEnv(process.env.ADMIN_JWT_SECRET));

export default async function PlanLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (!token) redirect('/admin/login?next=/plan');

  let role: AdminRole = 'admin';
  try {
    const { payload } = await jwtVerify(token, secret);
    role = (payload.role as AdminRole) || 'admin';
  } catch {
    redirect('/admin/login?next=/plan');
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <header className="bg-white border-b border-[#E5E2DC] h-16 flex items-center px-6">
        <div className="w-full max-w-[1100px] mx-auto flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.5A5.5 5.5 0 1 1 1.5 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M7 4v3l1.5 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-[#E5E2DC]">|</span>
            <span className="text-sm font-medium text-gray-500 group-hover:text-orange-500 transition-colors">
              Onboarding Compass
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {role === 'super_admin' && (
              <span className="hidden sm:inline-flex items-center text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                Super admin
              </span>
            )}
            <Link
              href="/admin"
              className="text-xs font-semibold text-gray-400 hover:text-orange-500 transition-colors"
            >
              ← Dashboard
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-[1100px] mx-auto px-6 py-12">
        {children}
      </main>
    </div>
  );
}
