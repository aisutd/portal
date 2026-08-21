import { Card } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export type ApplicationItem = {
  id?: string;
  title: string;
  status: { label: string } & (
    | { variant: "solid"; bg: string; color: string }
    | { variant: "outline" }
  );
  percent: number;
  fillColor: string;
};

function ApplicationRow({ item }: { item: ApplicationItem }) {
  return (
    <div className="flex w-full flex-col gap-[10px]">
      <div className="flex items-center justify-between">
        <span className="style-card-title text-[15px] leading-[22.5px] text-ink">
          {item.title}
        </span>
        {item.status.variant === "outline" ? (
          <Badge variant="outline" label={item.status.label} />
        ) : (
          <Badge
            variant="solid"
            label={item.status.label}
            bg={item.status.bg}
            color={item.status.color}
          />
        )}
      </div>
      <ProgressBar
        value={item.percent}
        trackColor="#e1e8ff"
        fillColor={item.fillColor}
        height={8}
      />
    </div>
  );
}

export function ApplicationsCard({ items }: { items: ApplicationItem[] }) {
  return (
    <Card className="flex w-full shrink-0 flex-col gap-[16px] self-stretch p-[29px] xl:w-[440px]">
      <SectionHeader
        title="Your Applications"
        action={
          <a
            href="#"
            className="style-meta-text text-[12px] leading-[16.8px] tracking-[0.2px] text-brand"
          >
            View all
          </a>
        }
      />
      {items.length === 0 ? (
        <div className="flex w-full flex-1 flex-col items-center justify-center gap-[8px] rounded-[8px] border border-dashed border-[#e2ded2] bg-[#f9f8f6] h-[170px] p-[12px]">
          <div className="flex size-[40px] items-center justify-center rounded-full bg-[#f4effc]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5d3999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path>
              <path d="m15 5 4 4"></path>
            </svg>
          </div>
          <h2 className="style-card-title text-[16px] text-ink">No applications</h2>
          <p className="style-body-text text-[13px] text-ink-muted text-center max-w-[280px] leading-tight">
            When you apply to a team or program, it'll show up here.
          </p>
          <Link href="/applications" className="mt-[2px]">
            <Button variant="soft" size="sm" pill className="font-black px-[20px]">
              Explore programs
            </Button>
          </Link>
        </div>
      ) : (
        items.map((item, index) => (
          <div key={item.id ?? `${item.title}-${index}`} className={index === 0 ? "w-full" : "w-full pt-[8px]"}>
            <ApplicationRow item={item} />
          </div>
        ))
      )}
    </Card>
  );
}
