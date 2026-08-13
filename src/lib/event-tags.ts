import type { TagData } from "@/components/dashboard/up-next-card";

const eventTagPalette: Record<string, TagData> = {
  FOOD: { label: "food", bg: "#f9d5d3", color: "#9a3b36" },
  DRINK: { label: "drink", bg: "#fbe3c6", color: "#8a4e18" },
  SOCIAL: { label: "social", bg: "#f6ecbb", color: "#766411" },
  LEARN: { label: "learn", bg: "#d3eccf", color: "#356b2e" },
  WORKSHOP: { label: "workshop", bg: "#cde9e5", color: "#1d6a61" },
  NETWORKING: { label: "networking", bg: "#d6e2ff", color: "#284b9c" },
  INDUSTRY: { label: "industry", bg: "#ded9f4", color: "#463e86" },
};

export function formatEventCardDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
    .format(date)
    .replace(", ", " · ");
}

export function normalizeEventTags(tags: Array<string | TagData> | null | undefined): TagData[] {
  if (!tags?.length) {
    return [];
  }

  return tags.map((tag) => {
    if (typeof tag === "string") {
      const key = tag.toUpperCase();
      return eventTagPalette[key] ?? {
        label: key.toLowerCase(),
        bg: "#efece3",
        color: "#6a685f",
      };
    }

    return tag;
  });
}
