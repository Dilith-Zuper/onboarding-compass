import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { jwtVerify } from 'jose';
import Link from 'next/link';

const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET!);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get('admin_token')?.value;

  if (token) {
    try {
      await jwtVerify(token, secret);
    } catch {
      redirect('/admin/login');
    }
  } else {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7]">
      <header className="bg-white border-b border-[#E5E2DC] h-16 flex items-center px-6">
        <div className="w-full max-w-[760px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.5A5.5 5.5 0 1 1 1.5 7" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M7 4v3l1.5 1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-[#E5E2DC]">|</span>
            <span className="text-sm font-medium text-gray-500">Onboarding Compass</span>
            <span className="text-[#E5E2DC]">·</span>
            <span className="text-sm text-gray-400">Admin</span>
          </div>
          <Link
            href="/admin/login"
            className="text-xs font-medium text-gray-400 hover:text-orange-500 transition-colors underline underline-offset-2"
          >
            Sign out
          </Link>
        </div>
      </header>
      <main className="max-w-[760px] mx-auto px-6 py-12 space-y-8">
        {children}
      </main>
    </div>
  );
}
