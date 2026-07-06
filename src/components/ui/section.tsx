import { cn } from '@/lib/utils';

export function Section({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn('py-20 md:py-28', className)} {...props}>
      {children}
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
  action,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: 'left' | 'center';
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5',
        align === 'center' && 'items-center text-center',
        action && 'md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow ? (
          <p className="eyebrow mb-4">
            <span className="h-px w-6 bg-brand" aria-hidden />
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-display-md text-balance">{title}</h2>
        {description ? (
          <p className="mt-4 text-base leading-relaxed text-ink-muted md:text-lg">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
