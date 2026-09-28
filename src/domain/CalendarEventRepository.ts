import type { CalendarEvent } from './CalendarEvent';

export interface CalendarEventRepository {
  listBetween(start: Date, endExclusive: Date): Promise<CalendarEvent[]>;
}
