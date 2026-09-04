interface FormattedLinksProps {
  links: string | string[];
  className?: string;
  badgeClassName?: string;
}

export interface ParsedLink {
  label: string;
  url: string;
}

/**
 * Parses pipe-separated or newline-separated link strings into an array of objects.
 * Handles both string inputs ("Label|https://...") and string arrays.
 */
export function parseLinks(input: string | string[] | undefined | null): ParsedLink[] {
  if (!input) return [];

  const rawLines = Array.isArray(input) ? input : input.split("\n");

  return rawLines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((item) => {
      const [label, url] = item.split("|");
      const cleanLabel = label?.trim();
      const cleanUrl = url?.trim();

      return {
        label: cleanLabel || cleanUrl || "",
        url: cleanUrl || cleanLabel || "",
      };
    })
    .filter((link) => link.url.length > 0);
}

/**
 * Renders pipe-separated links as styled badge buttons.
 */
export function FormattedLinks({
  links,
  className = "flex flex-wrap gap-2",
  badgeClassName = "inline-flex items-center rounded-md bg-brand/50 px-3 py-1.5 text-xs font-medium text-ink hover:bg-neutral-200 transition-colors",
}: FormattedLinksProps) {
  const parsedLinks = parseLinks(links);

  if (parsedLinks.length === 0) return null;

  return (
    <div className={className}>
      {parsedLinks.map((link, index) => (
        <a
          key={`${link.url}-${index}`}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={badgeClassName}
        >
          {link.label} ↗
        </a>
      ))}
    </div>
  );
}