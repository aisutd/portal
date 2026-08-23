import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label": string;
  className?: string;
};

/**
 * Search field with a real icon rather than an emoji in the placeholder.
 *
 * Shared so the desktop and mobile members toolbars can't drift apart.
 */
export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  className,
  ...rest
}: Props) {
  return (
    <div className={cn("group relative flex items-center", className)}>
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="pointer-events-none absolute left-[14px] size-[16px] text-ink-faint transition-colors group-focus-within:text-brand"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m21 21-4.35-4.35M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
        />
      </svg>

      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-full w-full rounded-[10px] border border-border-soft bg-white pl-[40px] pr-[14px] font-body  text-ink transition-[border-color,box-shadow] placeholder:text-ink-faint hover:border-ink-faint/50 focus:border-brand focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-soft [&::-webkit-search-cancel-button]:cursor-pointer"
        {...rest}
      />
    </div>
  );
}
