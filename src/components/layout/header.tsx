'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Heart, Menu, Phone, X } from 'lucide-react';
import { mainNav, site } from '@/lib/site';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import { ButtonLink } from '@/components/ui/button';
import { useFavorites } from '@/components/favorites/favorites-provider';

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { count } = useFavorites();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-300 ease-premium',
        scrolled
          ? 'border-b border-surface-border bg-white/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-white/0',
      )}
    >
      <div className="container flex h-[4.5rem] items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {mainNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                  active ? 'text-ink' : 'text-ink-muted hover:text-ink',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/te-preferuarat"
            aria-label="Të preferuarat"
            className="relative grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-ink/[0.05]"
          >
            <Heart className="h-[1.15rem] w-[1.15rem]" />
            {count > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[0.62rem] font-semibold text-white">
                {count}
              </span>
            ) : null}
          </Link>

          <a
            href={`tel:${site.phones[0].replace(/\s/g, '')}`}
            className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink/[0.05] md:inline-flex"
          >
            <Phone className="h-4 w-4 text-brand" />
            {site.phones[0]}
          </a>

          <ButtonLink href="/inventari" size="sm" className="hidden sm:inline-flex">
            Shiko inventarin
          </ButtonLink>

          <button
            type="button"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-ink/[0.05] lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'fixed inset-x-0 top-[4.5rem] z-40 origin-top border-b border-surface-border bg-white transition-all duration-300 ease-premium lg:hidden',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none -translate-y-2 opacity-0',
        )}
      >
        <nav className="container flex flex-col py-4">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="border-b border-surface-border py-3.5 text-base font-medium text-ink last:border-0"
            >
              {item.label}
            </Link>
          ))}
          <div className="flex flex-col gap-3 pt-5">
            <ButtonLink href="/inventari" className="w-full">
              Shiko inventarin
            </ButtonLink>
            <a
              href={`tel:${site.phones[0].replace(/\s/g, '')}`}
              className="inline-flex items-center justify-center gap-2 text-sm font-medium text-ink-muted"
            >
              <Phone className="h-4 w-4 text-brand" />
              {site.phones.join(' · ')}
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
