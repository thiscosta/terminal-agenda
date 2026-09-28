import { loadCalendarConfig } from './config/CalendarConfig';
import { GoogleOAuthService } from './infrastructure/google/GoogleOAuthService';

async function main(): Promise<void> {
  await new GoogleOAuthService(loadCalendarConfig()).connect();
  console.log('Google Calendar connected. Run npm start.');
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
