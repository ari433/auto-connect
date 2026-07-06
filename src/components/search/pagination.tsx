import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Server-rendered pagination that preserves the current query string. */
export function Pagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value == null || key === 'page') continue;
      params.set(key, Array.isArray(value) ? value.join(',') : value);
    }
    params.set('page', String(p));
    return `/inventari?${params.toString()}`;
  };

  const pages = pageWindow(page, totalPages);

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Faqet">
      <PageLink href={hrefFor(page - 1)} disabled={page <= 1} aria-label="Faqja e mëparshme">
        <ChevronLeft className="h-4 w-4" />
      </PageLink>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-ink-faint">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              'grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-medium transition-colors',
              p === page
                ? 'bg-ink text-white'
                : 'border border-surface-border bg-white text-ink-muted hover:border-ink/30',
            )}
          >
            {p}
          </Link>
        ),
      )}

      <PageLink href={hrefFor(page + 1)} disabled={page >= totalPages} aria-label="Faqja tjetër">
        <ChevronRight className="h-4 w-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  disabled,
  children,
  ...props
}: {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
} & React.AriaAttributes) {
  if (disabled) {
    return (
      <span
        className="grid h-10 w-10 place-items-center rounded-full border border-surface-border bg-white text-ink-faint opacity-40"
        {...props}
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="grid h-10 w-10 place-items-center rounded-full border border-surface-border bg-white text-ink transition-colors hover:border-ink/30"
      {...props}
    >
      {children}
    </Link>
  );
}

function pageWindow(page: number, total: number): (number | '…')[] {
  const out: (number | '…')[] = [];
  const add = (p: number) => out.push(p);
  add(1);
  const start = Math.max(2, page - 1);
  const end = Math.min(total - 1, page + 1);
  if (start > 2) out.push('…');
  for (let p = start; p <= end; p++) add(p);
  if (end < total - 1) out.push('…');
  if (total > 1) add(total);
  return out;
}
