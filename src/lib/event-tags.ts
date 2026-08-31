import type { TagData } from "@/components/dashboard/up-next-card";

const eventTagPalette: Record<string, TagData> = {
  FOOD: { label: "food", bg: "#f9d5d3", color: "#9a3b36" },
  DRINK: { label: "drink", bg: "#fbe3c6", color: "#8a4e18" },
  SOCIAL: { label: "social", bg: "#f6ecbb", color: "#766411" },
  LEARN: { label: "learn", bg: "#d3eccf", color: "#356b2e" },
  WORKSHOP: { label: "workshop", bg: "#cde9e5", color: "#1d6a61" },
  NETWORKING: { label: "networking", bg: "#d6e2ff", color: "#284b9c" },
  INDUSTRY: { label: "industry", bg: "#ded9f4", color: "#463e86" },
  ACADEMY: { label: "academy", bg: "#cbe6f2", color: "#175a75" },
  INNOVATION: { label: "innovation", bg: "#e6efc5", color: "#566d15" },
  MENTOR: { label: "mentor", bg: "#ebd9f3", color: "#653a80" },
  MENTEE: { label: "mentee", bg: "#f8d9e6", color: "#8e3a5d" },
  OFFICER: { label: "officer", bg: "#e0dfe4", color: "#403f4a" },
};

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
