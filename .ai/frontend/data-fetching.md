# Data Fetching & Metrics

All reads go straight from components to `supabase` (anon key + user session, schema `adhoc_analytics`, RLS enforced). There is no data layer, cache or React Query. Each widget has its own `useEffect` that reloads when `siteId`/`timeRange` changes.

## Time range cutoff
Copy-pasted in every widget:
```ts
if (timeRange === '24h') cutoff.setHours(now.getHours() - 24);
else if (timeRange === '7d') cutoff.setDate(now.getDate() - 7);
else cutoff.setDate(now.getDate() - 30);
```
If you change ranges, grep for `'7d'` and update every component (or extract a helper).

## Per-component queries
| Component | Table → columns | Filter | Refresh |
|---|---|---|---|
| Dashboard | `sites` `*` | RLS (own) | on mount, after add/manage |
| Analytics | `page_views` `id` · `sessions` `duration_seconds,page_count` · `sessions` `id` (active) | `site_id`, `timestamp`/`first_seen` ≥ cutoff, `last_seen` ≥ now−5min | **30s** |
| RealtimeVisitors | `page_views` | last 5 min, order desc, limit 10 | **5s** |
| TopPages | `page_views` `page_url` | cutoff | on range change |
| TopLinks | `link_clicks` `link_url,link_type,session_id` | cutoff | on range change |
| TrafficSources | `sessions` `referrer` | `first_seen` ≥ cutoff | on range change |
| BrowserStats | `sessions` (UA columns) | `first_seen` ≥ cutoff | on range change |
| VisitorList | `sessions`, then `page_views` (first IP/city per session), `ip_geo_cache` (country, connection type), `events` + `link_clicks` (counts per session) | cutoff; `last_seen` ≥ now−5min if active-only | on open |
| PageViewDrawer | `page_views` + `link_clicks` for a session | `site_id`, `session_id` | on open |
| IpGeoDrawer | `ip_geo_cache` `*` | `ip_address` | on open |
| lib/supabase.ts | RPCs `get_site_analytics_counts`, `delete_site_analytics_data`; `sites` update | | on demand |

Aggregation (counts, grouping, percentages, top-N) is done **in the browser** over fetched rows.

## Metric definitions
- **Page Views** — number of `page_views` rows in range.
- **Unique Visitors** — number of `sessions` with `first_seen` in range (session ≈ tab session; the same person on a new tab/day counts again).
- **Avg. Duration** — mean `duration_seconds` over "valid" sessions: excludes `duration = 0`, and excludes `duration > 3600 && page_count = 1` (likely abandoned tabs). Unload beacons keep extending `duration_seconds` via `now − first_seen`.
- **Active Now** — sessions with `last_seen` within 5 minutes.
- **Engaged (visitor filter)** — `avg_duration > 0 || page_count > 1 || event_count > 0`.
- **Traffic source** — `new URL(referrer).hostname` minus `www.`; empty referrer → "Direct".

## Gotchas
- PostgREST row caps (default ~1000) truncate the "fetch rows then count" pattern on busy sites; see [../global/rules.md](../global/rules.md#known-gotchas).
- `VisitorList` uses `.in('session_id', sessionIds)` with every session ID in the range → very long URLs / slow for large ranges. If it breaks on busy sites, move this into an RPC or chunk the IDs.
- `VisitorList` matches `page_views.ip_address` to `ip_geo_cache.ip_address` by string equality (both `inet`); keep their formats consistent.
- Geo (`country`, `city`) on sessions reflects only the visitor's first request.
