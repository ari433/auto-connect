'use client';

import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * AUTO CONNECT logo.
 *
 * Renders the brand image from `/logo.png` (drop your file into `public/`).
 * If that file is missing or fails to load, it falls back gracefully to the
 * built-in geometric wordmark — so the header is never broken.
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
  const [imgOk, setImgOk] = useState(true);
  const color = variant === 'light' ? 'text-white' : 'text-ink';

  const content = imgOk ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="AUTO CONNECT"
      onError={() => setImgOk(false)}
      className={cn('h-9 w-auto object-contain', className)}
    />
  ) : (
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
    <Link href={href} aria-label="AUTO CONNECT" className="inline-flex items-center">
      {content}
    </Link>
  );
}
