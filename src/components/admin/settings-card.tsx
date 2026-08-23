import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";

export type SettingRow =
  | { label: string; type: "toggle"; on?: boolean }
  | { label: string; type: "badge"; badge: string };

/**
 * Event settings panel: a stack of label + control rows separated by hairlines.
 */
export function SettingsCard({ items }: { items: SettingRow[] }) {
  return (
    <div className="flex w-full flex-col gap-[14px] rounded-[16px] border border-border-soft bg-white px-[25px] pb-[25px] pt-[24px]">
      <h3 className="font-display  font-semibold leading-[21.25px] text-ink [font-variation-settings:'wdth'_100]">
        Settings
      </h3>

      {items.map((item, i) => (
        <div key={item.label} className="flex w-full flex-col gap-[14px]">
          {i > 0 && <div className="h-px w-full bg-border-soft" />}
          <div className="flex items-center justify-between">
            <span className="font-body  font-normal leading-[20.3px] text-ink-muted">
              {item.label}
            </span>
            {item.type === "toggle" ? (
              <Toggle on={item.on} label={item.label} />
            ) : (
              <Badge label={item.badge} variant="outline" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
