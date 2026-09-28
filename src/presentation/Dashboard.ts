import blessed = require('blessed');
import type { Widgets } from 'blessed';
import type { LoadAgenda } from '../application/LoadAgenda';
import type { Clock } from '../domain/Clock';
import { theme } from './Theme';
import { AgendaWidget } from './AgendaWidget';
import { ClockWidget } from './ClockWidget';

export class Dashboard {
  private readonly screen: Widgets.Screen;
  private readonly agenda: AgendaWidget;
  private readonly clockWidget: ClockWidget;
  private readonly clockPanel: Widgets.BoxElement;
  private readonly agendaPanel: Widgets.BoxElement;
  private refreshInProgress = false;

  constructor(
    private readonly loadAgenda: LoadAgenda,
    clock: Clock,
    private readonly connectCalendar?: () => Promise<void>,
  ) {
    this.screen = blessed.screen({ smartCSR: true, title: 'Terminal Clock', fullUnicode: true });
    this.clockPanel = blessed.box({
      parent: this.screen,
      top: 3,
      left: 1,
      width: '100%-2',
      height: 11,
      border: { type: 'line' },
      borderStyle: { fg: theme.background },
      style: { fg: theme.text, bg: theme.background },
      tags: true,
    });
    this.agendaPanel = blessed.box({
      parent: this.screen,
      top: 14,
      left: 1,
      width: '100%-2',
      height: 9,
      label: ' TODAY · AGENDA ',
      border: { type: 'line' },
      borderStyle: { fg: theme.border },
      style: { fg: theme.text, bg: theme.panel },
      tags: true,
      scrollable: true,
      alwaysScroll: true,
      scrollbar: { ch: ' ', style: { bg: theme.teal } },
      padding: { left: 1, right: 1 },
    });
    this.agenda = new AgendaWidget(this.agendaPanel, this.screen);
    this.clockWidget = new ClockWidget(this.clockPanel, clock);
    this.createHeader();
    this.createFooter();
    this.bindKeyboard();
    this.screen.on('resize', () => this.render());
  }

  async start(): Promise<void> {
    this.render();
    setInterval(() => this.render(), 1_000).unref();
    setInterval(() => { void this.refreshAgenda(); }, 60_000).unref();
    if (this.connectCalendar) {
      this.agenda.showInitialLoading();
      try {
        await this.connectCalendar();
      } catch (error) {
        this.agenda.showInitialError(toErrorMessage(error));
        return;
      }
    }
    void this.refreshAgenda();
  }

  private createHeader(): void {
    const header = blessed.box({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '100%',
      height: 3,
      style: { fg: theme.muted, bg: theme.background },
      tags: true,
    });
    header.setContent(` {${theme.teal}-fg}●{/${theme.teal}-fg}  TERMINAL CLOCK${' '.repeat(Math.max(1, Number(this.screen.width || 80) - 37))}{${theme.muted}-fg}${Intl.DateTimeFormat().resolvedOptions().timeZone}{/${theme.muted}-fg} `);
  }

  private createFooter(): void {
    blessed.box({
      parent: this.screen,
      bottom: 0,
      left: 0,
      width: '100%',
      height: 1,
      align: 'center',
      style: { fg: theme.muted, bg: theme.background },
      content: ' q quit  ·  r refresh agenda ',
    });
  }

  private bindKeyboard(): void {
    this.screen.key(['q', 'C-c', 'escape'], () => {
      this.screen.destroy();
      process.exit(0);
    });
    this.screen.key('r', () => { void this.refreshAgenda(); });
  }

  private render(): void {
    const screenHeight = Number(this.screen.height || 24);
    const contentHeight = screenHeight - 4;
    const clockHeight = Math.max(9, Math.min(contentHeight - 6, Math.floor(contentHeight * 0.62)));
    this.clockPanel.height = clockHeight;
    this.agendaPanel.top = 3 + clockHeight;
    this.agendaPanel.height = Math.max(1, screenHeight - this.agendaPanel.top - 1);
    this.clockWidget.update(Math.max(7, clockHeight - 4));
    this.screen.render();
  }

  private async refreshAgenda(): Promise<void> {
    if (this.refreshInProgress) return;
    this.refreshInProgress = true;
    this.agenda.showInitialLoading();
    try {
      this.agenda.render(await this.loadAgenda.execute());
    } catch (error) {
      this.agenda.showInitialError(toErrorMessage(error));
    } finally {
      this.refreshInProgress = false;
    }
  }
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
