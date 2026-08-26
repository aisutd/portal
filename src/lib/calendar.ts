interface CalendarEventData {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: Date | string;
  endTime: Date | string;
  userId?: string; // Optional: used to create a unique UID for ICS files
}

export function generateCalendarLinks(event: CalendarEventData) {
  // Format dates to ISO 8601 basic format required by calendar services (YYYYMMDDTHHMMSSZ)
  const formatToCalendarDate = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    // Strip hyphens, colons, and milliseconds
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const startTimeStr = formatToCalendarDate(event.startTime);
  const endTimeStr = formatToCalendarDate(event.endTime);
  
  const title = `${event.title}`;
  const description = `View event portal: https://portal.aisutd.org/events/${event.id}\n\n${event.description || ""}`;
  const location = event.location || "TBA";

  const outlookStartTime = new Date(event.startTime).toISOString();
  const outlookEndTime = new Date(event.endTime).toISOString();
  const eventTitleEncoded = encodeURIComponent(title);
  const eventDescriptionEncoded = encodeURIComponent(description);
  const eventLocationEncoded = encodeURIComponent(location);
  const eventStartTimeEncoded = encodeURIComponent(startTimeStr);
  const eventEndTimeEncoded = encodeURIComponent(endTimeStr);

  // 1. Google Calendar URL
  const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitleEncoded}&details=${eventDescriptionEncoded}&dates=${eventStartTimeEncoded}/${eventEndTimeEncoded}&location=${eventLocationEncoded}&ctz=America/Chicago 
`;

  // 2. Outlook Web URL
  const outlookUrl = `https://outlook.live.com/owa/?path=/calendar/action/compose&rru=addevent&subject=${eventTitleEncoded}&startdt=${outlookStartTime}&enddt=${outlookEndTime}&body=${eventDescriptionEncoded}&location=${eventLocationEncoded}`;

  // 3. Raw ICS File Content (Apple Mail / Desktop Clients)
  const uid = event.userId ? `${event.id}-${event.userId}` : `${event.id}-anon`;
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PROID:-//Artificial Intelligence Society//Portal//EN",
    "BEGIN:VEVENT",
    `UID:${uid}@aisociety.io`,
    `DTSTAMP:${formatToCalendarDate(new Date())}`,
    `DTSTART:${startTimeStr}`,
    `DTEND:${endTimeStr}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g, "\\n")}`, // Escape newlines in ICS files
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  return {
    googleUrl,
    outlookUrl,
    icsContent
  };
}
