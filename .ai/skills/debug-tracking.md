# Skill: Debug "No Data" / Wrong Data

Work from the browser to the database.

1. **Script loads?** On the tracked site: Network tab shows `analytics.js` 200 (from the dashboard origin). Console: "Analytics: No tracking ID provided" ⇒ snippet config missing. No output at all can also mean the tracking ID is in the hardcoded `deprecatedSite` list in `analytics.js`.
2. **Beacon sent?** Network shows a POST to `.../functions/v1/track`. Inspect the payload for `tracking_id`/`session_id`/`page_url`.
3. **Response?** (Beacon responses are visible in devtools even though the script ignores them.)
   - `404` — wrong `tracking_id` or site `active = false`. Note `tracking_id` can contain `+`/`/`; make sure it was pasted verbatim.
   - `400` — missing fields (see [../backend/track-function.md](../backend/track-function.md)).
   - `200` with `excluded:true` — the visitor's IP matches the site's `excluded_ips` (check the real IP the function sees; see [../features/ip-exclusion.md](../features/ip-exclusion.md)).
   - `500` / network error — check Supabase function logs; confirm the proxy forwards `/functions/v1` and CORS isn't being stripped.
4. **Function logs** — insert errors for sessions/page_views/etc. are *not* surfaced in responses. Look for `console.error` output (`ip_geo_cache ... error`, `MaxMind API error`, `Error tracking page view`) and inspect the tables directly.
5. **Rows exist but dashboard is empty** — check you're logged in as the site's owner (RLS), the selected site/time range, and that the schema `adhoc_analytics` is exposed to PostgREST with grants for `authenticated`.
6. **Wrong IP / country (e.g. always the proxy's)** — the proxy isn't sending `X-Client-IP` + `X-Proxy-Secret`, or `PROXY_SHARED_SECRET` mismatches.
7. **No city/country** — MaxMind secrets missing, MaxMind returned non-2xx (private/reserved IPs return an error), or the event path (events never get geo).
8. **Counts look capped near 1000** — PostgREST row limit with client-side counting; see [../global/rules.md](../global/rules.md#known-gotchas).
9. **Durations/odd averages** — see metric definitions in [../frontend/data-fetching.md](../frontend/data-fetching.md).

Local testing: `npm run dev`, serve `public/test-tracking.html`, point `apiUrl` at the deployed function (there is no local Supabase stack in this repo).
