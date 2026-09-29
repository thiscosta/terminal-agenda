import { loadCalendarConfig } from './config/CalendarConfig';
import { LoadAgenda } from './application/LoadAgenda';
import { GoogleCalendarRepository, hasGoogleAuthorization } from './infrastructure/calendar/GoogleCalendarRepository';
import { MacCalendarRepository } from './infrastructure/calendar/MacCalendarRepository';
import { SystemClock } from './infrastructure/time/SystemClock';
import { GoogleOAuthService } from './infrastructure/google/GoogleOAuthService';
import { Dashboard } from './presentation/Dashboard';
import type { CalendarEventRepository } from './domain/CalendarEventRepository';

export async function start(): Promise<void> {
  const config = loadCalendarConfig();
  const repository: CalendarEventRepository = config.platform === 'darwin'
    ? new MacCalendarRepository()
    : new GoogleCalendarRepository(config);
  const authorization = config.platform !== 'darwin' && hasGoogleAuthorization(config)
    ? () => new GoogleOAuthService(config).connect()
    : undefined;
  const clock = new SystemClock();
  const dashboard = new Dashboard(new LoadAgenda(repository, clock), clock, authorization);
  await dashboard.start();
}

if (require.main === module) {
  start().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
