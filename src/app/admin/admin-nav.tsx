'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Inbox, RefreshCw, ArrowUpRight, Car } from 'lucide-react';
import { cn } from '@/lib/utils';

const links = [
  { href: '/admin', label: 'Përmbledhje', icon: LayoutDashboard, exact: true },
  { href: '/admin/vetura', label: 'Veturat', icon: Car, exact: false },
  { href: '/admin/leads', label: 'Kërkesat', icon: Inbox, exact: false },
  { href: '/admin/sync', label: 'Sinkronizimi', icon: RefreshCw, exact: false },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {links.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-ink text-white'
                : 'text-ink-muted hover:bg-ink/[0.04] hover:text-ink',
            )}
          >
            <Icon
              className={cn(
                'h-[1.05rem] w-[1.05rem] shrink-0',
                active ? 'text-white' : 'text-ink-faint group-hover:text-ink',
              )}
            />
            {label}
          </Link>
        );
      })}

      <div className="my-2 h-px bg-surface-border" />

      <Link
        href="/"
        className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-ink/[0.04] hover:text-ink"
      >
        <ArrowUpRight className="h-[1.05rem] w-[1.05rem] shrink-0 text-ink-faint group-hover:text-ink" />
        Shko te faqja
      </Link>
    </nav>
  );
}
