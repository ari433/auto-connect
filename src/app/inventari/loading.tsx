import { VehicleGridSkeleton } from '@/components/vehicle/vehicle-grid';

export default function Loading() {
  return (
    <>
      <section className="border-b border-surface-border bg-white">
        <div className="container py-12 md:py-16">
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton mt-4 h-10 w-72 rounded" />
          <div className="skeleton mt-3 h-4 w-56 rounded" />
        </div>
      </section>
      <section className="bg-surface-subtle py-10 md:py-14">
        <div className="container">
          <div className="skeleton mb-8 h-11 w-full rounded-full" />
          <div className="grid gap-8 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr]">
            <div className="hidden lg:block">
              <div className="skeleton h-[560px] rounded-2xl" />
            </div>
            <VehicleGridSkeleton count={6} />
          </div>
        </div>
      </section>
    </>
  );
}
