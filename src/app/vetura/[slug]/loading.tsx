export default function Loading() {
  return (
    <div className="bg-surface-subtle py-8 md:py-12">
      <div className="container grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
        <div>
          <div className="skeleton aspect-[16/10] w-full rounded-2xl" />
          <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton aspect-[4/3] rounded-lg" />
            ))}
          </div>
          <div className="skeleton mt-12 h-8 w-48 rounded" />
          <div className="skeleton mt-4 h-24 w-full rounded" />
        </div>
        <div>
          <div className="skeleton h-[420px] rounded-2xl" />
          <div className="skeleton mt-6 h-[480px] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
