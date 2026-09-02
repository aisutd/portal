// Wrapper is oversized (110vw) before rotating so the band stays a clean,
// gap-free rectangle at the full width instead of a distorted sliver.
export function Marquee({ text }: { text: string }) {
  return (
    <div className="relative h-[100px] w-full overflow-visible">
      <div className="absolute left-1/2 top-1/2 w-[110vw] -translate-x-1/2 -translate-y-1/2 -rotate-[2deg] bg-brand py-[18px]">
        <div className="flex w-max animate-marquee-scroll">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
              {Array.from({ length: 4 }).map((_, i) => (
                <p
                  key={i}
                  className="whitespace-nowrap px-[24px] style-badge-text text-[21px] leading-[normal] tracking-[1.5px] text-white"
                >
                  {text}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
