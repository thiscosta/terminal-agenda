import fs from 'node:fs';
import path from 'node:path';

export interface GoogleOAuthConfig {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly redirectUri?: string;
}

export interface CalendarConfig {
  readonly platform: NodeJS.Platform;
  readonly google: GoogleOAuthConfig | null;
  readonly credentialsPath: string;
  readonly tokenPath: string;
  readonly calendarId: string;
}

export function loadCalendarConfig(): CalendarConfig {
  const root = path.resolve(__dirname, '../..');
  const credentialsPath = process.env.GOOGLE_CREDENTIALS || path.join(root, 'credentials.json');
  return {
    platform: process.platform,
    google: readGoogleOAuthConfig(credentialsPath),
    credentialsPath,
    tokenPath: process.env.GOOGLE_TOKEN || path.join(root, 'token.json'),
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
  };
}

function readGoogleOAuthConfig(credentialsPath: string): GoogleOAuthConfig | null {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: 'http://127.0.0.1',
    };
  }
  if (fs.existsSync(credentialsPath)) {
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8')) as {
      installed?: { client_id: string; client_secret: string; redirect_uris?: string[] };
      web?: { client_id: string; client_secret: string; redirect_uris?: string[] };
    };
    const client = credentials.installed ?? credentials.web;
    if (!client) throw new Error('Google credentials must contain an installed or web OAuth client.');
    return {
      clientId: client.client_id,
      clientSecret: client.client_secret,
      redirectUri: client.redirect_uris?.[0],
    };
  }
  return null;
}
