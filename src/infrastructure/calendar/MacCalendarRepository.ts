import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { CalendarEvent } from '../../domain/CalendarEvent';
import type { CalendarEventRepository } from '../../domain/CalendarEventRepository';

const executeFile = promisify(execFile);

interface MacCalendarEventRecord {
  readonly start: string;
  readonly summary: string;
  readonly location: string;
  readonly allDay: boolean;
}

export class MacCalendarRepository implements CalendarEventRepository {
  async listBetween(start: Date, endExclusive: Date): Promise<CalendarEvent[]> {
    const script = buildCalendarQuery(start, endExclusive);
    let stdout: string;
    try {
      ({ stdout } = await executeFile('osascript', ['-l', 'JavaScript', '-e', script], {
        timeout: 120_000,
        maxBuffer: 2 * 1024 * 1024,
      }));
    } catch (error) {
      throw new Error(formatMacCalendarError(error));
    }

    let records: MacCalendarEventRecord[];
    try {
      records = JSON.parse(stdout.trim() || '[]') as MacCalendarEventRecord[];
    } catch {
      throw new Error('macOS Calendar returned data the app could not read.');
    }
    return records.map(toCalendarEvent).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  }
}

function buildCalendarQuery(start: Date, endExclusive: Date): string {
  return `
var calendarApp = Application("Calendar");
var start = new Date(${start.getTime()});
var end = new Date(${endExclusive.getTime()});
var rows = [];
var calendars = calendarApp.calendars();
for (var i = 0; i < calendars.length; i++) {
  var matches = calendars[i].events.whose({_and: [
    {_match: [ObjectSpecifier().startDate, {">=": start}]},
    {_match: [ObjectSpecifier().startDate, {"<": end}]}
  ]})();
  for (var j = 0; j < matches.length; j++) {
    var event = matches[j];
    rows.push({
      start: new Date(event.startDate()).toISOString(),
      summary: event.summary() || "Untitled event",
      location: event.location() || "",
      allDay: Boolean(event.alldayEvent())
    });
  }
}
JSON.stringify(rows);`;
}

function toCalendarEvent(record: MacCalendarEventRecord): CalendarEvent {
  return {
    title: record.summary,
    startsAt: new Date(record.start),
    isAllDay: record.allDay,
    location: record.location || undefined,
  };
}

function formatMacCalendarError(error: unknown): string {
  const value = error as NodeJS.ErrnoException & { stderr?: string; killed?: boolean; signal?: string | null };
  const detail = String(value.stderr || '').trim();
  if (/not authorized|not permitted|(-1743)/i.test(detail)) {
    return 'macOS blocked Calendar access. Allow Calendar access for your terminal in System Settings → Privacy & Security → Automation.';
  }
  if (value.killed || value.signal === 'SIGTERM') {
    return 'macOS Calendar did not respond within two minutes. Check for a Calendar access prompt, allow access, then retry.';
  }
  return `macOS Calendar query failed: ${(detail || value.message || 'unknown error').slice(0, 300)}`;
}
