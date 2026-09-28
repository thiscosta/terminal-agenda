# Terminal Clock

A realtime clock and today's calendar agenda in a Node.js terminal UI built with `blessed`.

## macOS setup

1. Add your Google account to macOS under **System Settings → Internet Accounts** and enable **Calendars**. If the account is already in the Calendar app, no extra account setup is needed.
2. Run `npm install` and `npm start`.
3. When macOS asks, allow the terminal app to access Calendar. If access was denied, change it under **System Settings → Privacy & Security → Automation**.

The app reads events from the macOS Calendar app using JavaScript for Automation, so macOS Google Calendar access uses the account already configured on the Mac. No Google Cloud project, OAuth client, `credentials.json`, or token file is needed on macOS. Events refresh every minute and are grouped into today and tomorrow sections.

## Other platforms

On platforms without macOS Calendar, the app uses the Google Calendar API. Configure a Google Cloud OAuth client and either set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, or put its JSON in `credentials.json`, then run `npm run auth` and `npm start`.

Press `r` to refresh the agenda or `q` to quit.

## Development

```sh
npm run dev
npm run build
```

The code is separated by responsibility:

- `domain/` defines calendar events and repository/clock interfaces.
- `application/` contains the agenda use case and its result model.
- `infrastructure/` implements macOS Calendar and Google Calendar access.
- `presentation/` owns the blessed dashboard, clock, and agenda widgets.
- `config/` loads platform and Google OAuth settings; `main.ts` wires the app together.
