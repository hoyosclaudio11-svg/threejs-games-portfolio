export function Marquee() {
  const Row = () => (
    <div className="flex shrink-0 items-center gap-10 pr-10">
      {Array.from({ length: 3 }).map((_, i) => (
        <span key={i} className="flex items-center gap-10">
          <span className="whitespace-nowrap font-display text-4xl font-light italic text-bone/90 sm:text-6xl">
            the wagon that walks
          </span>
          <span className="h-2 w-2 rounded-full bg-ember" />
          <span className="stroke-bone-soft whitespace-nowrap font-display text-4xl font-light tracking-[0.08em] sm:text-6xl">
            EL VAGÓN QUE CAMINA
          </span>
          <span className="h-2 w-2 rounded-full bg-moss" />
        </span>
      ))}
    </div>
  );

  return (
    <div className="relative overflow-hidden border-y border-bone/10 bg-night-2 py-8 sm:py-12">
      <div className="animate-marquee flex w-max">
        <Row />
        <Row />
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-night to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-night to-transparent" />
    </div>
  );
}
