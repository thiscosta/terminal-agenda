export interface CalendarEvent {
  readonly title: string;
  readonly startsAt: Date;
  readonly isAllDay: boolean;
  readonly location?: string;
}
