import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * AUTO CONNECT logo — the real brand mark (car + wordmark).
 * `dark` (default) is the black/red logo for light surfaces (header);
 * `light` is the white/red version for dark surfaces (footer).
 */
const SOURCES = {
  dark: '/logo-auto-connect.png',
  light: '/logo-auto-connect-light.png',
} as const;

// Intrinsic size of the exported PNG (kept for correct aspect ratio).
const INTRINSIC = { width: 798, height: 307 } as const;

export function Logo({
  className,
  variant = 'dark',
  href = '/',
}: {
  className?: string;
  variant?: 'dark' | 'light';
  href?: string | null;
}) {
  const content = (
    <Image
      src={SOURCES[variant]}
      alt="AUTO CONNECT"
      width={INTRINSIC.width}
      height={INTRINSIC.height}
      priority
      className={cn('h-10 w-auto', className)}
    />
  );

  if (href === null) return content;

  return (
    <Link href={href} aria-label="AUTO CONNECT" className="inline-flex items-center">
      {content}
    </Link>
  );
}
