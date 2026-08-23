export type PastTileData =
  | { variant: "image"; label: string }
  | { variant: "stat"; stat: string; label: string };

/**
 * A tile in the Past Adventures gallery — either a captioned photo placeholder
 * or a highlighted stat card.
 */
export function PastTile(props: PastTileData) {
  if (props.variant === "stat") {
    return (
      <div className="flex h-[150px] flex-col items-center justify-center rounded-[16px] border border-border-soft bg-orange-soft">
        <span className="style-card-title  leading-[34.56px] tracking-[-0.4px] text-orange-ink [font-variation-settings:'wdth'_100]">
          {props.stat}
        </span>
        <span className="style-meta-text  leading-[16.8px] tracking-[0.2px] text-orange-ink">
          {props.label}
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-[150px] items-center justify-center rounded-[12px] bg-photo">
      <span className="style-caption tracking-[1.5px] text-photo-text">
        {props.label}
      </span>
    </div>
  );
}
