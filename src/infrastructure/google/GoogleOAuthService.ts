import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { URL } from 'node:url';
import { google } from 'googleapis';
import type { CalendarConfig } from '../../config/CalendarConfig';

const READ_EVENTS_SCOPE = 'https://www.googleapis.com/auth/calendar.events.readonly';

export class GoogleOAuthService {
  constructor(private readonly config: CalendarConfig) {}

  async connect(): Promise<void> {
    const credentials = this.config.google;
    if (!credentials) throw new Error('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, or provide credentials.json.');

    const server = http.createServer();
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Could not open the local OAuth callback server.');

    const redirectUri = `http://127.0.0.1:${address.port}`;
    const auth = new google.auth.OAuth2(credentials.clientId, credentials.clientSecret, redirectUri);
    const authorizationUrl = auth.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: [READ_EVENTS_SCOPE] });
    console.log(`Google sign-in URL:\n${authorizationUrl}`);
    openBrowser(authorizationUrl);

    try {
      await new Promise<void>((resolve, reject) => {
        server.once('request', async (request, response) => {
          const requestUrl = new URL(request.url ?? '/', redirectUri);
          const code = requestUrl.searchParams.get('code');
          if (!code) {
            response.writeHead(400).end('Authorization was not completed. You can close this page.');
            reject(new Error('Google authorization was not completed.'));
            return;
          }
          try {
            const { tokens } = await auth.getToken(code);
            fs.mkdirSync(path.dirname(this.config.tokenPath), { recursive: true });
            fs.writeFileSync(this.config.tokenPath, JSON.stringify(tokens, null, 2), { mode: 0o600 });
            response.writeHead(200, { 'Content-Type': 'text/plain' }).end('Connected to Google Calendar. You can close this page.');
            resolve();
          } catch (error) {
            response.writeHead(500).end('Google authorization failed. Check the terminal for details.');
            reject(error);
          }
        });
      });
    } finally {
      server.close();
    }
  }
}

function openBrowser(url: string): void {
  const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  const child = spawn(command, args, { detached: true, stdio: 'ignore' });
  child.on('error', error => console.error(`Could not open a browser automatically: ${error.message}`));
  child.unref();
}
