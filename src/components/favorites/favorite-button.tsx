'use client';

import { Heart } from 'lucide-react';
import { useFavorites } from './favorites-provider';
import { cn } from '@/lib/utils';

export function FavoriteButton({
  slug,
  className,
  variant = 'floating',
}: {
  slug: string;
  className?: string;
  variant?: 'floating' | 'inline';
}) {
  const { has, toggle, ready } = useFavorites();
  const active = ready && has(slug);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? 'Hiq nga të preferuarat' : 'Shto te të preferuarat'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(slug);
      }}
      className={cn(
        'group/fav inline-grid place-items-center transition-all duration-300 ease-premium',
        variant === 'floating' &&
          'h-10 w-10 rounded-full bg-white/95 text-ink shadow-card backdrop-blur hover:scale-105 active:scale-95',
        variant === 'inline' &&
          'h-11 w-11 rounded-full border border-surface-border bg-white text-ink hover:border-ink/30',
        className,
      )}
    >
      <Heart
        className={cn(
          'h-[1.15rem] w-[1.15rem] transition-all duration-300',
          active ? 'fill-brand text-brand' : 'text-ink group-hover/fav:text-brand',
        )}
      />
    </button>
  );
}
