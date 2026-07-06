'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { VehicleImage as VehicleImageType } from '@/types/vehicle';
import { VehicleImage } from './vehicle-image';
import { cn } from '@/lib/utils';

export function Gallery({ images, title }: { images: VehicleImageType[]; title: string }) {
  const [active, setActive] = useState(0);
  const safe = images.length ? images : [{ url: '', alt: title }];
  const current = safe[Math.min(active, safe.length - 1)];

  const go = (dir: -1 | 1) =>
    setActive((i) => (i + dir + safe.length) % safe.length);

  return (
    <div className="flex flex-col gap-3">
      <div className="group relative aspect-[16/10] overflow-hidden rounded-2xl bg-surface-sunken">
        <VehicleImage
          src={current.url}
          alt={current.alt}
          priority
          sizes="(max-width: 1024px) 100vw, 60vw"
        />
        {safe.length > 1 && (
          <>
            <GalleryNav side="left" onClick={() => go(-1)} />
            <GalleryNav side="right" onClick={() => go(1)} />
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
              {safe.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'h-1.5 rounded-full bg-white transition-all duration-300',
                    i === active ? 'w-6 opacity-100' : 'w-1.5 opacity-50',
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {safe.length > 1 && (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
          {safe.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Foto ${i + 1}`}
              className={cn(
                'relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-sunken transition-all duration-300',
                i === active
                  ? 'ring-2 ring-ink ring-offset-2 ring-offset-surface-subtle'
                  : 'opacity-70 hover:opacity-100',
              )}
            >
              <VehicleImage src={img.url} alt={img.alt} sizes="20vw" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GalleryNav({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Foto e mëparshme' : 'Foto tjetër'}
      className={cn(
        'absolute top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow-card backdrop-blur transition-all duration-300 hover:scale-105 group-hover:opacity-100',
        side === 'left' ? 'left-4' : 'right-4',
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
