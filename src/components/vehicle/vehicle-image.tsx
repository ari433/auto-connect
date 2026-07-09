'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn, sizedImageUrl } from '@/lib/utils';

/**
 * Vehicle photo with a branded fallback. If a remote image fails to load we
 * render an elegant placeholder rather than a broken image — the platform never
 * looks unfinished.
 */
export function VehicleImage({
  src,
  alt,
  fill = true,
  sizes,
  priority,
  className,
  variant = 'card',
}: {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** 'card' = light thumbnail (grids, gallery strip); 'full' = full-res photo. */
  variant?: 'card' | 'full';
}) {
  const [failed, setFailed] = useState(false);
  const resolved = sizedImageUrl(src, variant);

  if (failed || !resolved) {
    return <ImageFallback className={className} />;
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      fill={fill}
      sizes={sizes ?? '(max-width: 768px) 100vw, 33vw'}
      priority={priority}
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  );
}

export function ImageFallback({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'absolute inset-0 grid place-items-center bg-gradient-to-br from-surface-sunken to-[#e9e9ec]',
        className,
      )}
    >
      <svg width="72" height="72" viewBox="0 0 24 24" fill="none" className="text-ink/15">
        <path
          d="M3 13.5 5 8a3 3 0 0 1 2.83-2h8.34A3 3 0 0 1 19 8l2 5.5M5 17.5h14M6.5 13.5h11"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="7" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="17" cy="17.5" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    </div>
  );
}
