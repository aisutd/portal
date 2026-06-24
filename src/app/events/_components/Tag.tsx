import { TAG_COLORS, type TagName } from "../_data/events";

export default function Tag({ name }: { name: TagName }) {
  const { bg, text } = TAG_COLORS[name];
  return (
    <span
      className="font-ibm inline-flex items-center rounded-full px-[13px] py-[6px] text-[11.5px] tracking-[0.3px]"
      style={{ backgroundColor: bg, color: text }}
    >
      {name}
    </span>
  );
}
