# Onyx Solar Console

A live dashboard for **SolarMax Onyx** hybrid inverters, built on the Next.js App
Router. Sign in with the same CloudInverter.net / SolarTouch account you use in the
mobile app. The Next.js server signs every upstream request with AES-CBC and returns
one normalized snapshot to the browser.

There is no Express server and no hardcoded account. Credentials are entered on a
sign-in screen, sealed in an encrypted HttpOnly session cookie, and used only on the
server to sign CloudInverter requests.

## What you get

- **Live solar telemetry** — current output, today's yield, lifetime generation and
  inverter health.
- **Ambient-glass dashboard** — a dark, luminous interface with a kinetic energy-flow
  hero, glass panels, Sora typography and a responsive mobile dock.
- **Cloud insights** — day, month and year energy history from CloudInverter: a
  5-minute power curve, daily energy split, monthly/yearly production versus
  consumption charts, period totals and a table view. This works for days the
  dashboard was not open.
- **Battery panel** — SOC ring, charge/discharge state, voltage, current, temperature,
  SOH, pack count, BMS limits and daily energy.
- **Energy ledger and PV strings** — today's solar, home, import, export and battery
  flows; per-string power, voltage and current.
- **System status** — grid voltage/frequency quality meters, inverter health, WiFi,
  firmware, BMS limits, EPS/backup and lifetime counters.
- **Notification logs** — inverter error logs from CloudInverter's web log search,
  with 7/30/90-day ranges, an error-type dropdown, fault/notice/active filters,
  open/cleared status, pagination and a responsive card layout.
- **Credential-based sessions** — no account values in environment variables, no
  credentials in the client bundle.
- **Accessible by construction** — keyboard focus, status labels that do not rely on
  colour alone, a chart legend plus table view, and reduced-motion support.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 App Router, React 19, TypeScript |
| Data | Server Components, Server Actions, Route Handlers |
| Styling | Tailwind CSS 4, custom glass tokens, Sora via `next/font` |
| Charts | Recharts with a validated categorical palette |
| Session | `jose` encrypted JWT (A256GCM) in an HttpOnly cookie |
| History | Fetched live from CloudInverter; no durable browser or server storage |
| Upstream | CloudInverter.net Senergytec web API (telemetry, history, log search) |

## Quick start

Requires **Node.js 20.9 or newer**.

```bash
npm install
```

`AUTH_SECRET` is required in development too. Create `.env.local` from the
example and add a session secret:

```bash
# PowerShell
Copy-Item .env.example .env.local

# macOS / Linux
cp .env.example .env.local
```

Generate a secret (paste the value after `AUTH_SECRET=`):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Then:

```bash
npm run dev
```

Open <http://localhost:3000> and sign in with the CloudInverter username and password
you use in SolarTouch. The first request logs in, discovers the first plant on the
account, and renders the dashboard.

> `.env.local` is gitignored. The old `ONYX_USERNAME` / `ONYX_PASSWORD` variables are
> no longer read by the app and can be removed from any existing `.env` file.

## Deploy to Vercel

1. Push this repository to GitHub and import it into Vercel.
2. Add `AUTH_SECRET` in **Project → Settings → Environment Variables** for Production
   and Preview. Use the same value on every instance.
3. Optionally set `POLL_INTERVAL_MS` (default `30000`, minimum `15000`).
4. Deploy.

No database, cron job, or background worker is required. Data is fetched on demand
when the dashboard loads and every poll interval while it is open. On HTTPS the
session cookie is named `__Host-onyx_session`; changing `AUTH_SECRET` invalidates
every existing session.

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│ Browser                                                     │
│  Server-rendered shell + Server Actions (login / logout)    │
│  Live provider: polls /api/summary every 30s                │
│  History fetched on demand; nothing stored in the browser   │
└───────────────────────────┬─────────────────────────────────┘
                            │ same-origin HTTPS
┌───────────────────────────▼─────────────────────────────────┐
│ Next.js (Node runtime)                                      │
│  Route Handlers: /api/summary /api/refresh                  │
│                  /api/notifications /api/insights            │
│                  /api/health                                 │
│  Session: encrypted JWE cookie → credentials per request    │
│  Signing: AES-256-CBC with the CloudInverter key + IV       │
│  Cache: per-process login token and snapshot dedupe         │
└───────────────────────────┬─────────────────────────────────┘
                            │ outbound HTTPS
┌───────────────────────────▼─────────────────────────────────┐
│ CloudInverter.net / SolarTouch                              │
│  Senergytec web API v2                                      │
│  telemetry + cloud history + signed log search              │
└─────────────────────────────────────────────────────────────┘
```

### Authentication

- The sign-in form calls a **Server Action**. It validates the credentials by logging
  in and discovering a plant, then writes a `jose` **JWE** (A256GCM) into an
  HttpOnly, SameSite=Lax cookie. In production the cookie is `Secure` and uses the
  `__Host-` prefix. Sessions last 12 hours.
- The cookie contains the username and password **encrypted**. Every server request
  decrypts it to sign the next upstream request. Nothing is stored in `localStorage`
  or in the client bundle.
- A rejected upstream login invalidates the session: API routes return `401`, the
  client redirects to `/login?reason=expired`, and server-rendered pages redirect the
  same way.
- Signing out clears the cookie and the in-process token cache.

### Polling and caching

- The dashboard fetches `/api/summary` on mount and every `POLL_INTERVAL_MS`.
- The route handler keeps a per-credentials, per-process cache and dedupes concurrent
  polls. It returns cached data for up to 80% of the poll interval.
- Failures use exponential backoff (up to five minutes) and return a `stale` state
  when a previous snapshot exists.
- Manual refresh is a same-origin `POST /api/refresh`, rate-limited to one request
  every three seconds.
- There is intentionally no `use cache`/shared cache for account data. Per-user
  credentials must never be served from a shared cache, and serverless instances do
  not run background loops.

### Cloud history

- No history is stored in `localStorage`, `sessionStorage` or IndexedDB. The only
  browser state is the encrypted, HttpOnly session cookie.
- **Insights** fetches history live from CloudInverter: the 5-minute day curve
  (`dayProductionAndConsumptionAreaTime`), the daily energy split
  (`daytwopiechartNew`) and the plant area curve (`groupAreaCurve`) for day, month
  and year periods, with previous/next navigation.
- History therefore remains available for days the dashboard was closed and is
  consistent across browsers and devices. Old `/history` links redirect to
  `/insights`.
- The overview card “Today's power” uses the same cloud day curve instead of local
  samples.

### Notifications

- Uses the web API's `logsearch` endpoint on the same signed web session. The
  payload sends `MemberID`, `GoodsTypeId` (the plant group's `AutoID`),
  `SDate`/`EDate` from the selected range, and `selectType: 1` for the error log.
- Supported ranges are 7, 30 and 90 days. Each range is cached for 60 seconds; the
  client refreshes every five minutes and on demand.
- The error-type dropdown lists the full known error catalog from the SolarTouch
  catalog, with counts for types present in the selected range. Selecting any type
  filters the summary, tabs and table client-side, matching the portal's
  event/error-type filter. It does not make another API request.
- `status: "0"` means the log is still open; `"1"` means it has cleared. "Active now"
  counts open logs in the selected range.
- The page also calls `getPvierrorRealtime` for the device's current alerts, so an
  alert that is still open appears even when it falls outside the selected log range.
- Fault and notice labels follow the SolarTouch app's classification.

### API contract

All JSON responses are `Cache-Control: no-store`. Authentication is the session cookie
only; no endpoint accepts credentials in the URL or body (except the login Server
Action).

| Method | Route | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Liveness probe: `{ ok, service, runtime, time }`. |
| `GET` | `/api/summary` | Session | Current `DashboardState`; `401` when signed out. |
| `POST` | `/api/refresh` | Session + same origin | Forces an upstream poll; `429` within 3 seconds. Returns `{ ok, state }`. |
| `GET` | `/api/notifications?days=7\|30\|90&refresh=1` | Session | Normalized log search plus current active alerts for the selected range; `502` on an upstream failure. |
| `GET` | `/api/insights?period=day\|month\|year&date=...` | Session | Cloud day curve and energy history. Date is `YYYY-MM-DD`, `YYYY-MM` or `YYYY`. |
| — | Login / logout Server Actions | — | Set or clear the encrypted session cookie. |

The dashboard HTML is rendered dynamically and sent with
`Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`.

### Data notes

- **Signs:** grid power is positive when importing and negative when exporting.
  Battery power is positive when discharging and negative when charging.
- **Home load:** the flow diagram, cloud history, "Consumed today" and lifetime home
  totals include the EPS/backup output, because this plant reports real household load
  there. The System status panel still shows the EPS channel separately.
- **Grid energy direction:** CloudInverter's `EF*` fields are energy **from** the grid
  (purchased) and `ET*` fields are energy **to** the grid (feed-in). The dashboard uses
  that mapping, so the portal's lifetime "purchased" and "feed-in" totals now agree.
- **Cloud history:** the Insights day curve reports 5-minute power samples in the
  inverter's local time; month/year rows are daily/monthly energy in kWh. The daily
  energy split can include battery discharge under self-consumption, and the EPS load
  may be counted separately.
- **Refresh cadence:** CloudInverter itself refreshes roughly every five minutes, so a
  30-second poll will not always produce new values. Polling is deliberately gentle.
- **Auto-discovery:** the first plant and first inverter on the account are used.
  Accounts with several plants need a selection screen; the old `ONYX_GOODS_ID` /
  `ONYX_GROUP_ID` pinning variables are not part of this version.
- **Cloud history:** the Insights day curve provides 5-minute samples for a day;
  month and year rows come from the plant area curve. Everything is queried live, so
  no backfill or local recording is involved.

## Design notes

The visual direction is **ambient glass**: a deep midnight plane, slow aurora washes,
hairline glass panels and a single kinetic energy-flow hero. Sora carries display and
data type; there is no second typeface.

The chart uses a colourblind-safe categorical palette validated against the dark chart
surface (`#CE7F33` solar, `#3187C4` grid, `#22A378` battery, `#876FCC` home). Series
identity is never carried by colour alone: the chart ships a legend, direct latest
values, a crosshair tooltip, a table view, and a text explanation of signed values.
Reduced-motion users get static flow paths with direction arrows.

## Scripts

```bash
npm run dev        # Next.js dev server (Turbopack)
npm run build      # production build + typecheck
npm start          # serve the production build
npm run typecheck  # tsc --noEmit
npm test           # signing, parser, notifications and insights tests
```

## Security

- `.env.local`, `.env` and local data are gitignored.
- The session cookie is encrypted, HttpOnly, Secure in production, SameSite=Lax and
  scoped to the whole site.
- Credentials never reach the client bundle and are never logged.
- The refresh route checks `Origin` against `Host`; Server Actions include Next.js's
  built-in origin protection.
- `AUTH_SECRET` must be a long random value (32 random bytes is recommended). Rotating
  it signs everyone out.
- The app only makes outbound requests to CloudInverter.net. It has no login of its own
  beyond the inverter account, so deploy it behind your own access control if you want
  an additional layer.

## Attribution

The CloudInverter signing scheme, endpoint flow and sensor normalization are ported
from [`farhanshahlabs/ha_solarmax_onyx`](https://github.com/farhanshahlabs/ha_solarmax_onyx)
(GPL-3.0). This project is released under GPL-3.0 as well; see [LICENSE](LICENSE).

This project is not affiliated with SolarMax, SolarTouch or CloudInverter. Use it with
your own account and at your own risk.
