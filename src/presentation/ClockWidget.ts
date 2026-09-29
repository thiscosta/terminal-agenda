import blessed = require('blessed');
import type { Widgets } from 'blessed';
import type { Clock } from '../domain/Clock';
import { theme } from './Theme';

const DIGITS: Record<string, string[]> = {
  '0': [' █████ ', '██   ██', '██  ███', '██ █ ██', '███  ██', '██   ██', ' █████ '],
  '1': ['   ██  ', ' ████  ', '   ██  ', '   ██  ', '   ██  ', '   ██  ', ' ██████'],
  '2': [' █████ ', '██   ██', '     ██', '  ████ ', ' ██    ', '██     ', '███████'],
  '3': ['██████ ', '     ██', '     ██', ' █████ ', '     ██', '     ██', '██████ '],
  '4': ['██  ██ ', '██  ██ ', '██  ██ ', '███████', '    ██ ', '    ██ ', '    ██ '],
  '5': ['███████', '██     ', '██     ', '██████ ', '     ██', '     ██', '██████ '],
  '6': [' █████ ', '██     ', '██     ', '██████ ', '██   ██', '██   ██', ' █████ '],
  '7': ['███████', '     ██', '    ██ ', '   ██  ', '  ██   ', '  ██   ', '  ██   '],
  '8': [' █████ ', '██   ██', '██   ██', ' █████ ', '██   ██', '██   ██', ' █████ '],
  '9': [' █████ ', '██   ██', '██   ██', ' ██████', '     ██', '     ██', ' █████ '],
  ':': ['   ', '██ ', '██ ', '   ', '██ ', '██ ', '   '],
};

export class ClockWidget {
  private readonly dateLine: Widgets.BoxElement;
  private readonly timeLine: Widgets.BoxElement;

  constructor(parent: Widgets.BoxElement, private readonly clock: Clock) {
    this.dateLine = blessed.box({ parent, top: 0, left: 0, width: '100%', height: 1, align: 'center', style: { fg: theme.amber, bg: theme.panel, bold: true } });
    this.timeLine = blessed.box({ parent, top: 1, left: 0, width: '100%', height: 7, align: 'center', style: { fg: theme.red, bg: theme.panel, bold: true } });
  }

  update(): void {
    const now = this.clock.now();
    this.dateLine.setContent(now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
    const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    this.timeLine.height = 7;
    this.timeLine.setContent(Array.from({ length: 7 }, (_, row) =>
      time.split('').map(character => DIGITS[character][row]).join('  '),
    ).join('\n'));
  }
}
