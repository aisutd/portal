import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";

export type Achievement = {
  value: string;
  label: string;
  bg: string;
  color: string;
};

function AchievementTile({ tile }: { tile: Achievement }) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-[8px] self-stretch rounded-[14px] p-[18px]"
      style={{ backgroundColor: tile.bg }}
    >
      <span
        className="style-card-title  leading-[30px] text-center [font-variation-settings:'wdth'_100]"
        style={{ color: tile.color }}
      >
        {tile.value}
      </span>
      <span
        className="style-meta-text  leading-[16.8px] tracking-[1px] text-center"
        style={{ color: tile.color }}
      >
        {tile.label}
      </span>
    </div>
  );
}

export function AchievementsCard({ tiles }: { tiles: Achievement[] }) {
  return (
    <Card className="flex min-w-px flex-1 flex-col gap-[16px] self-stretch p-[27px]">
      <SectionHeader title="Your Achievements" />
      <div className="flex w-full items-start justify-center gap-[16px]">
        {tiles.map((tile) => (
          <AchievementTile key={tile.label} tile={tile} />
        ))}
      </div>
    </Card>
  );
}
