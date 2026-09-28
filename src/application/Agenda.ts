import type { CalendarEvent } from '../domain/CalendarEvent';

export interface Agenda {
  readonly today: CalendarEvent[];
  readonly tomorrow: CalendarEvent[];
}
