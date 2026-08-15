import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";

type DotStat = {
  kind: "dot";
  label: string;
  value: string;
  dotColor: string;
};

type ProgressStat = {
  kind: "progress";
  label: string;
  value: string;
  percent: number;
  trackColor: string;
  fillColor: string;
};

export type Stat = DotStat | ProgressStat;

const labelClass =
  "font-techno text-[12px] uppercase leading-[normal] tracking-[3px] text-ink-faint whitespace-nowrap";
const valueClass =
  "font-body text-[15px] font-bold leading-[22.5px] text-ink whitespace-nowrap";

function StatCard({ stat }: { stat: Stat }) {
  if (stat.kind === "dot") {
    return (
      <Card className="flex min-w-[220px] flex-1 items-center gap-[12px] self-stretch px-[21px] py-[19px]">
        <span
          className="size-[10px] shrink-0 rounded-[5px]"
          style={{ backgroundColor: stat.dotColor }}
        />
        <div className="flex flex-col">
          <span className={labelClass}>{stat.label}</span>
          <span className={valueClass}>{stat.value}</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex min-w-[220px] flex-1 flex-col gap-[8px] self-stretch px-[21px] py-[19px]">
      <div className="flex items-center justify-between">
        <span className={labelClass}>{stat.label}</span>
        <span className={valueClass}>{stat.value}</span>
      </div>
      <ProgressBar
        value={stat.percent}
        trackColor={stat.trackColor}
        fillColor={stat.fillColor}
        height={7}
      />
    </Card>
  );
}

export function StatusStrip({ stats, banner }: { stats: Stat[], banner?: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-[16px]">
      <section className="flex w-full flex-wrap items-start justify-center gap-[16px]">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </section>
      {banner && (
        <div className="flex w-full">
          {banner}
        </div>
      )}
    </div>
  );
}
