import Link from 'next/link';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'dark' | 'outline' | 'ghost' | 'light';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 font-medium tracking-tight transition-all duration-300 ease-premium disabled:opacity-50 disabled:pointer-events-none select-none';

const variants: Record<Variant, string> = {
  primary:
    'bg-brand text-white hover:bg-brand-600 active:bg-brand-700 shadow-[0_8px_24px_-12px_rgba(214,0,28,0.7)] hover:shadow-[0_12px_32px_-12px_rgba(214,0,28,0.75)]',
  dark: 'bg-ink text-white hover:bg-ink-soft active:bg-black',
  outline:
    'border border-ink/15 text-ink hover:border-ink/40 hover:bg-ink/[0.03] active:bg-ink/[0.05]',
  ghost: 'text-ink hover:bg-ink/[0.05]',
  light: 'bg-white text-ink hover:bg-white/90 shadow-card',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-[0.8rem] rounded-full',
  md: 'h-11 px-6 text-sm rounded-full',
  lg: 'h-[3.25rem] px-8 text-[0.95rem] rounded-full',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  className?: string;
}

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  ),
);
Button.displayName = 'Button';

type ButtonLinkProps = CommonProps &
  React.ComponentProps<typeof Link>;

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    />
  );
}
