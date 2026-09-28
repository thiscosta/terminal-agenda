import fs from 'node:fs';
import { google, type calendar_v3 } from 'googleapis';
import type { CalendarEvent } from '../../domain/CalendarEvent';
import type { CalendarEventRepository } from '../../domain/CalendarEventRepository';
import type { CalendarConfig, GoogleOAuthConfig } from '../../config/CalendarConfig';

export class GoogleCalendarRepository implements CalendarEventRepository {
  constructor(private readonly config: CalendarConfig) {}

  async listBetween(start: Date, endExclusive: Date): Promise<CalendarEvent[]> {
    const auth = this.createClient();
    const api = google.calendar({ version: 'v3', auth });
    const response = await api.events.list({
      calendarId: this.config.calendarId,
      timeMin: start.toISOString(),
      timeMax: endExclusive.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    });
    return (response.data.items ?? []).map(toCalendarEvent);
  }

  private createClient() {
    const oauth = this.config.google;
    if (!oauth || !fs.existsSync(this.config.tokenPath)) {
      throw new Error('Google Calendar is not connected. Configure an OAuth client and run npm run auth.');
    }
    const auth = new google.auth.OAuth2(oauth.clientId, oauth.clientSecret, oauth.redirectUri);
    auth.setCredentials(JSON.parse(fs.readFileSync(this.config.tokenPath, 'utf8')));
    return auth;
  }
}

function toCalendarEvent(event: calendar_v3.Schema$Event): CalendarEvent {
  const allDay = Boolean(event.start?.date);
  const startsAt = allDay && event.start?.date
    ? parseLocalDate(event.start.date)
    : new Date(event.start?.dateTime ?? NaN);
  return {
    title: event.summary || 'Untitled event',
    startsAt,
    isAllDay: allDay,
    location: event.location || undefined,
  };
}

function parseLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function hasGoogleAuthorization(config: CalendarConfig): config is CalendarConfig & { google: GoogleOAuthConfig } {
  return Boolean(config.google && !fs.existsSync(config.tokenPath));
}
