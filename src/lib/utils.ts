/**
 * Tiny class-name joiner. Filters out falsy values so conditional classes can be
 * passed inline without pulling in extra dependencies.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

// Formats date and time in a legible, neat format: Mon, Aug. 20 - 6:00PM
export function formatEventDate(dateString: string, includeDayOfWeek = false) {
  const date = new Date(dateString);
  const now = new Date();
  
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isWithinAWeek = includeDayOfWeek && diffDays >= 0 && diffDays <= 7;

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    hour: "numeric",
    minute: "2-digit",
  };

  if (isWithinAWeek) {
    const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date);
    const timeDate = new Intl.DateTimeFormat("en-US", options).format(date);
    return `${weekday}, ${timeDate}`;
  }

  return new Intl.DateTimeFormat("en-US", options).format(date).replace(", ", " · ");
}

export function getRelativeTimeString(eventStartTime: Date): { 
  relativeText: string; 
  headlineText: string;
} {
  const now = new Date();
  const eventDate = new Date(eventStartTime);
  
  // Difference in milliseconds
  const diffMs = eventDate.getTime() - now.getTime();
  
  // Fallback if event is already in the past
  if (diffMs <= 0) {
    return { 
      relativeText: "starting right now", 
      headlineText: "Event Started!" 
    };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  // Scenario 1: Less than 24 hours away
  if (diffHours < 24) {
    const hoursText = diffHours <= 1 ? "1 hour" : `${diffHours} hours`;
    return {
      relativeText: `today in ${hoursText}`,
      headlineText: `Starting today in ${hoursText}!`,
    };
  }

  // Scenario 2: 24 hours or more away
  const daysText = diffDays === 1 ? "1 day" : `${diffDays} days`;
  return {
    relativeText: `in ${daysText}`,
    headlineText: `Happening in ${daysText}!`,
  };
}