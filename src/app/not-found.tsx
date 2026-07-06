import { ButtonLink } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-[6rem] font-semibold leading-none tracking-tightest text-brand">404</p>
      <h1 className="mt-4 text-display-sm">Faqja nuk u gjet</h1>
      <p className="mt-3 max-w-md text-ink-muted">
        Faqja që kërkoni nuk ekziston ose është zhvendosur. Kthehuni te ballina ose
        shfletoni inventarin tonë.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/">Kthehu te ballina</ButtonLink>
        <ButtonLink href="/inventari" variant="outline">
          Shiko inventarin
        </ButtonLink>
      </div>
    </div>
  );
}
