import blessed = require('blessed');
import type { Widgets } from 'blessed';
import type { Clock } from '../domain/Clock';
import { theme } from './Theme';

const DIGITS: Record<string, string[]> = {
  '0': [' █████ ', '██   ██', '██  ███', '██ █ ██', '███  ██', '██   ██', ' █████ '],
  '1': [' █████ ', '██████ ', '   ███ ', '   ███ ', '   ███ ', '   ███ ', '███████'],
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
    this.timeLine = blessed.box({ parent, top: 2, left: 0, width: '100%', height: 7, align: 'center', style: { fg: theme.red, bg: theme.panel, bold: true } });
  }

  update(availableRows: number): void {
    const now = this.clock.now();
    this.dateLine.setContent(now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }));
    const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    this.timeLine.setContent(this.renderLargeTime(time, availableRows));
  }

  private renderLargeTime(time: string, availableRows: number): string {
    const screenWidth = Number(this.timeLine.screen.width || 80);
    const availableWidth = Math.max(1, screenWidth - 8);
    const baseWidth = time.split('').reduce((total, character) => total + DIGITS[character][0].length, 0)
      + (time.length - 1) * 2;
    const scale = Math.max(1, Math.min(availableWidth / baseWidth, availableRows / 7));
    const targetHeight = Math.round(7 * scale);
    const glyphWidths = time.split('').map(character => Math.max(1, Math.round(DIGITS[character][0].length * scale)));
    const glyphs = time.split('').map((character, index) => scaleGlyph(DIGITS[character], glyphWidths[index], targetHeight));
    const gapWidth = Math.max(2, Math.floor((availableWidth - glyphWidths.reduce((sum, width) => sum + width, 0)) / (time.length - 1)));
    const renderedWidth = glyphWidths.reduce((sum, width) => sum + width, 0) + gapWidth * (time.length - 1);
    const leftPadding = Math.max(0, Math.floor((availableWidth - renderedWidth) / 2));

    this.timeLine.height = targetHeight;
    return Array.from({ length: targetHeight }, (_, row) => {
      const glyphRows = glyphs.map(glyph => glyph[row]);
      return `${' '.repeat(leftPadding)}${glyphRows.join(' '.repeat(gapWidth))}`;
    }).join('\n');
  }
}

function scaleGlyph(rows: string[], width: number, height: number): string[] {
  return Array.from({ length: height }, (_, row) => {
    const sourceRow = rows[Math.floor((row / height) * rows.length)];
    return Array.from({ length: width }, (_, column) => {
      const sourceColumn = Math.floor((column / width) * sourceRow.length);
      return sourceRow[sourceColumn];
    }).join('');
  });
}
