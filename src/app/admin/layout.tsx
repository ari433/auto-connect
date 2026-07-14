import type { ReactNode } from 'react';
import { Logo } from '@/components/ui/logo';
import { adminTokenConfigured, isAuthorizedSession } from '@/lib/auth';
import { AdminNav } from './admin-nav';
import { AdminLogin } from './admin-login';

export const metadata = {
  title: 'Paneli i administrimit',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const authorized = await isAuthorizedSession();
  const gated = adminTokenConfigured();

  return (
    <div className="container-tight py-8 lg:py-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:w-60 lg:shrink-0">
          <div className="rounded-2xl border border-surface-border bg-white p-4 shadow-card">
            <div className="px-1 pb-3">
              <Logo href="/admin" />
            </div>
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-[0.65rem] font-semibold uppercase tracking-eyebrow text-ink-faint">
                Administrim
              </span>
              <span
                className={
                  'inline-flex h-2 w-2 rounded-full ' +
                  (gated ? 'bg-emerald-500' : 'bg-amber-400')
                }
                title={gated ? 'I mbrojtur me token' : 'Qasje e hapur (dev)'}
              />
            </div>
            <AdminNav />
          </div>
        </aside>

        {/* Content */}
        <main className="min-w-0 flex-1">
          {gated && !authorized ? (
            <div className="pt-6 sm:pt-10">
              <AdminLogin />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
