// Calendar event helpers — Google Calendar template URL + .ics file generation.

export interface CalendarEvent {
  /** Stable id for the event so re-imports update instead of duplicate. */
  uid: string;
  title: string;
  description: string;
  location?: string;
  start: Date;
  end: Date;
}

/**
 * Format a Date as basic UTC for iCalendar / Google Calendar URL params:
 *   YYYYMMDDTHHmmssZ  (no separators, with Z suffix)
 */
function fmtUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Escape a free-text string for inclusion in iCalendar TEXT properties. */
function escapeIcs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Build an https://calendar.google.com/calendar/render add-event URL. */
export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${fmtUtc(event.start)}/${fmtUtc(event.end)}`,
    details: event.description,
  });
  if (event.location) params.set("location", event.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Build an .ics (iCalendar) document.
 * Includes a DISPLAY VALARM (push notification on phone/computer) and an
 * EMAIL VALARM (Apple Calendar honours this and sends a mail; Google ignores).
 */
export function buildIcs(event: CalendarEvent): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Safebreeder//Reminders//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${fmtUtc(new Date())}`,
    `DTSTART:${fmtUtc(event.start)}`,
    `DTEND:${fmtUtc(event.end)}`,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description)}`,
  ];
  if (event.location) lines.push(`LOCATION:${escapeIcs(event.location)}`);
  lines.push(
    // Push/banner alarm at the moment the event starts.
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "TRIGGER:PT0M",
    `DESCRIPTION:${escapeIcs(event.title)}`,
    "END:VALARM",
    // Email alarm at the same moment (Apple Calendar will send it; Google ignores).
    "BEGIN:VALARM",
    "ACTION:EMAIL",
    "TRIGGER:PT0M",
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(event.description)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  );
  return lines.join("\r\n");
}

/** Trigger a browser download of an .ics file with the given content. */
export function downloadIcs(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Compute the reminder window for an HPG sample.
 * Reminder fires at 09:00 ART on `sampleDate + 27 days`, lasts 1 hour.
 * Returns the start/end as UTC Dates (so the iCalendar Z-suffix encodes correctly).
 *
 * 09:00 ART = 12:00 UTC (Argentina is UTC-3, no DST).
 */
export function reminderWindow(sampleIsoDate: string): {
  start: Date;
  end: Date;
} {
  const [y, m, d] = sampleIsoDate.split("-").map((n) => parseInt(n, 10));
  // Construct as UTC at 12:00 (= 9 AM ART) on sampleDate + 27 days.
  const start = new Date(Date.UTC(y, m - 1, d + 27, 12, 0, 0));
  const end = new Date(Date.UTC(y, m - 1, d + 27, 13, 0, 0));
  return { start, end };
}

/** ISO date `YYYY-MM-DD` plus N days, as a new ISO date string. */
export function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map((n) => parseInt(n, 10));
  const out = new Date(Date.UTC(y, m - 1, d + days));
  return out.toISOString().slice(0, 10);
}
