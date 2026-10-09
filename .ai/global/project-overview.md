# Project Overview

**Ad-Hoc Analytics** is a small, privacy-focused, cookie-less web analytics platform (a self-run alternative to Google Analytics). Site owners add a `<script>` snippet to their websites; visits, link clicks, downloads and custom events are sent to a Supabase Edge Function and shown on a React dashboard.

Author/owner: Micah Murray. Originally generated with Bolt, since extended by hand and with AI assistance.

## Two audiences

| Audience | Surface |
|---|---|
| Site owners (dashboard users) | React SPA, email/password login, sees only their own sites (RLS) |
| Visitors of tracked sites | Never see anything; `public/analytics.js` runs silently on the tracked site |

## Data flow

```
Tracked website
  └─ loads  <app-origin>/analytics.js        (static file served with the SPA)
       └─ navigator.sendBeacon(JSON) ──►  <supabase>/functions/v1/track   (Edge Function, no JWT needed)
                                              ├─ validates tracking_id against adhoc_analytics.sites
                                              ├─ parses User-Agent (ua-parser-js), resolves client IP
                                              ├─ drops excluded IPs, MaxMind geo lookup (optional cache)
                                              └─ writes sessions / page_views / link_clicks / events (service key)
Dashboard (React SPA)
  └─ supabase-js (anon key + user JWT, schema adhoc_analytics) ──► RLS-filtered SELECTs, polled
```

Real traffic reaches Supabase through a reverse proxy; see [rules.md](rules.md#hosting--proxy) and [../features/ip-exclusion.md](../features/ip-exclusion.md).

## Key concepts

- **Site** — one tracked website. Has a public `tracking_id` (random base64, embedded in the snippet), `domain`, `active`, `is_default` (the one auto-selected on login; max one per user, enforced by trigger), `use_uaparser`, `use_paid_geo`, `excluded_ips`.
- **Session** — one browser tab session. ID is `sess_<ms>_<rand>` in `sessionStorage`, so it resets when the tab closes. "Unique visitors" in the UI = number of sessions.
- **Page view** — one URL load (or SPA URL change). Holds IP, UA, screen size, language, geo.
- **Link click** — outbound link or file download (`link_type` = `outbound` | `file_download`).
- **Event** — custom event from `window.analytics.trackEvent(name, data)`; `event_data` is JSONB.
- **Active now** — a session with `last_seen` within the last 5 minutes.
- **Time range** — `'24h' | '7d' | '30d'`, chosen on the dashboard, applied client-side as a `gte` cutoff.

## Current status

- Working: sessions/page views, link & download tracking, custom events, browser/OS/device stats, traffic sources, top pages/links, visitor list with filters and per-visitor timeline, per-site IP exclusion (IPv4/IPv6/CIDR), MaxMind geolocation (free GeoLite default, paid GeoIP with cache), IP geo detail drawer, per-site data deletion.
- Three legacy SCA sites are disabled and deliberately ignored client-side (see [rules.md](rules.md#known-gotchas)).
- No automated tests. No router (single-page, state-driven).
- Git: work happens on `ai-dev`; `main` is the PR target. A `fork/analytics.ad-hoc.app` branch holds the variant for the analytics.ad-hoc.app deployment.
