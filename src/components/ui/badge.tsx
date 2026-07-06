import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'brand' | 'dark' | 'success' | 'muted';

const tones: Record<Tone, string> = {
  neutral: 'bg-white/90 text-ink border border-surface-border backdrop-blur',
  brand: 'bg-brand text-white',
  dark: 'bg-ink text-white',
  success: 'bg-emerald-600 text-white',
  muted: 'bg-ink/[0.06] text-ink-muted',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wide',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
