import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * AUTO CONNECT wordmark. Minimal, geometric, confident — the red accent is the
 * only colour used, in keeping with the brand system.
 */
export function Logo({
  className,
  variant = 'dark',
  href = '/',
}: {
  className?: string;
  variant?: 'dark' | 'light';
  href?: string | null;
}) {
  const color = variant === 'light' ? 'text-white' : 'text-ink';

  const content = (
    <span
      className={cn(
        'inline-flex items-center gap-2.5 font-display font-semibold tracking-tightest',
        color,
        className,
      )}
    >
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center rounded-[10px] bg-brand text-white shadow-[0_6px_16px_-8px_rgba(214,0,28,0.8)]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 15.5 9.2 6.5a2 2 0 0 1 3.46 0L18 15.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path d="M6.5 12.5h9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </span>
      <span className="text-[1.05rem] leading-none">
        AUTO<span className="text-brand"> CONNECT</span>
      </span>
    </span>
  );

  if (href === null) return content;

  return (
    <Link href={href} aria-label="AUTO CONNECT" className="inline-flex">
      {content}
    </Link>
  );
}
