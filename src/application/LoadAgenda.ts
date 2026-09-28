import type { Agenda } from './Agenda';
import type { CalendarEventRepository } from '../domain/CalendarEventRepository';
import type { Clock } from '../domain/Clock';

export class LoadAgenda {
  constructor(
    private readonly events: CalendarEventRepository,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<Agenda> {
    const now = this.clock.now();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const afterTomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
    const events = await this.events.listBetween(todayStart, afterTomorrowStart);

    return {
      today: events.filter(event => isSameLocalDay(event.startsAt, todayStart)),
      tomorrow: events.filter(event => isSameLocalDay(event.startsAt, tomorrowStart)),
    };
  }
}

function isSameLocalDay(first: Date, second: Date): boolean {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}
