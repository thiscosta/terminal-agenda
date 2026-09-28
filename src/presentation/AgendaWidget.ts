import blessed = require('blessed');
import type { Widgets } from 'blessed';
import type { Agenda } from '../application/Agenda';
import type { CalendarEvent } from '../domain/CalendarEvent';
import { theme } from './Theme';

export class AgendaWidget {
  private hasContent = false;

  constructor(private readonly element: Widgets.BoxElement, private readonly screen: Widgets.Screen) {}

  showInitialLoading(): void {
    if (this.hasContent) return;
    this.element.setContent('\n {#66728e-fg}Loading calendar events…{/}');
    this.screen.render();
  }

  showInitialError(message: string): void {
    if (this.hasContent) return;
    this.element.setContent(`\n {#ff171d-fg}Calendar unavailable{/}\n\n{#66728e-fg}${escapeTags(message)}{/}`);
    this.hasContent = true;
    this.screen.render();
  }

  render(agenda: Agenda): void {
    this.element.setContent(`\n${this.renderSection('TODAY', agenda.today)}\n\n${this.renderSection('TOMORROW', agenda.tomorrow)}`);
    this.hasContent = true;
    this.screen.render();
  }

  private renderSection(title: string, events: CalendarEvent[]): string {
    const rows = events.length ? events.map(event => this.renderEvent(event)).join('\n\n') : `{${theme.muted}-fg}No events{/${theme.muted}-fg}`;
    return `{${theme.teal}-fg}{bold}${title}{/bold}{/${theme.teal}-fg}\n${rows}`;
  }

  private renderEvent(event: CalendarEvent): string {
    const time = event.isAllDay
      ? 'ALL DAY'
      : event.startsAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    const location = event.location ? `\n   {${theme.muted}-fg}${escapeTags(event.location)}{/${theme.muted}-fg}` : '';
    const title = escapeTags(event.title || 'Untitled event');
    const gap = Math.max(2, Math.min(10, this.availableWidth() - time.length - title.length));
    return `{${theme.teal}-fg}${time}{/${theme.teal}-fg}${' '.repeat(gap)}{${theme.amber}-fg}${title}{/${theme.amber}-fg}${location}`;
  }

  private availableWidth(): number {
    return Math.max(24, Number(this.screen.width || 80) - 10);
  }
}

function escapeTags(text: string): string {
  return text.replace(/[{}]/g, '');
}
