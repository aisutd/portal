/**
 * Full-bleed slogan banner that sits between the programs and the open-apps
 * list. Tilted a touch and slightly over-scaled so the rotated ends still
 * cover the card width (the parent card clips the overflow).
 */
export function Marquee({ text }: { text: string }) {
  return (
    <div className="w-full overflow-hidden">
      <div className="rotate-[-0.8deg] scale-[1.03] bg-brand py-[18px]">
        <p className="text-center font-logo text-[21px] leading-[normal] tracking-[1.5px] text-white">
          {text}
        </p>
      </div>
    </div>
  );
}
