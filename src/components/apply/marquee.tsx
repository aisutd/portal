/**
 * Full-bleed slogan banner that sits between the programs and the open-apps
 * list. Tilted a touch and slightly over-scaled so the rotated ends still
 * cover the card width without clipping the edges.
 */
export function Marquee({ text }: { text: string }) {
  return (
    <div className="relative z-20 w-full overflow-visible py-4">
      <div className="-mx-4 w-[calc(100%+2rem)] -rotate-1 scale-[1.04] bg-brand py-[18px] shadow-sm">
        <p className="text-center font-logo  font-medium leading-normal tracking-[1.5px] text-white">
          {text}
        </p>
      </div>
    </div>
  );
}