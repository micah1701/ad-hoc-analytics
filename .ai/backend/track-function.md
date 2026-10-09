# `track` Edge Function

File: `supabase/functions/track/index.ts` (single file, Deno, ~460 lines). The only server-side code in the project. Called by `analytics.js` from third-party browsers, so it is **public (no JWT)** and sends `Access-Control-Allow-Origin: *`.

## Auth / client
Creates a Supabase client with `SUPABASE_URL` + secret `default_supabase_secret_key` (service-level), schema `adhoc_analytics`. It therefore bypasses RLS; all trust comes from validating `tracking_id`.

## Request (JSON body; `analytics.js` sends it via `sendBeacon`)
Always: `tracking_id`, `session_id`.
| Kind | Extra fields |
|---|---|
| Page view | `page_url`, `page_title`, `referrer`, `screen_width`, `screen_height`, `language` |
| Unload | same as page view + `is_unload: true` |
| Link click | page fields + `event_type: 'link_click'`, `link_url`, `link_text`, `link_type` |
| Custom event | page fields + `event_name`, `event_data` |

## Processing order (the order matters)
1. `OPTIONS` → 200 with CORS headers.
2. Parse JSON; 400 if `tracking_id`/`session_id` missing.
3. Look up site by `tracking_id` with `active = true` (`id, active, use_uaparser, excluded_ips, use_paid_geo`); **404** if none.
4. Parse User-Agent from the `user-agent` header (`ua-parser-js`, or regex fallback if `use_uaparser` is false).
5. Resolve client IP (`getClientIp`), parse it (`parseIp`). Unparseable → treated as no IP (so it can't break `inet` inserts).
6. If the IP matches `excluded_ips` → return `{success:true, excluded:true}`; nothing written.
7. `event_name` present → insert into `events`, return. (No geo lookup.)
8. Geo lookup (`lookupGeo`) — see [../features/geolocation.md](../features/geolocation.md).
9. `event_type === 'link_click'` → 400 if `link_url`/`link_type` missing, else insert `link_clicks` (with `country`), return.
10. 400 if no `page_url`.
11. Sessions: if a row with this `session_id` exists → update `last_seen`, `duration_seconds` (now − first_seen), `exit_page`, and `page_count += 1` (`+0` when `is_unload`). Otherwise insert a new session with UA + geo fields.
12. `is_unload` → set `exit_timestamp` on the most recent `page_views` row for this session + `page_url`; return (no new page view).
13. Insert `page_views` row (includes raw `user_agent`, `ip_address`, geo).
14. Any thrown error → 500 `{error:'Internal server error'}` (logged with `console.error`).

Insert/update results are **not checked for errors** (except the geo cache); failures are silent. When data goes missing, look at Supabase function logs and the DB, not the response code.

## Client IP resolution
```ts
// trusted proxy path
if (PROXY_SHARED_SECRET && x-client-ip && x-proxy-secret === PROXY_SHARED_SECRET) → x-client-ip
// fallback
x-forwarded-for[0] || x-real-ip
```
Details and IPv6/CIDR matching in [../features/ip-exclusion.md](../features/ip-exclusion.md).

## Response codes
`200` ok / excluded / OPTIONS · `400` bad payload · `404` unknown or inactive tracking id · `500` unexpected error.

## Secrets
`default_supabase_secret_key`, `MAXMIND_ACCOUNT_ID`, `MAXMIND_LICENSE_KEY`, `PROXY_SHARED_SECRET` (all optional except the first; missing MaxMind creds just disables geo with a logged error).

## Deploy
From the repo root, with the Supabase CLI (not the dashboard):
```bash
npx supabase functions list
npx supabase functions deploy track --use-api --no-verify-jwt
```
Keep `verify_jwt` off (beacons carry no JWT). There is no `_shared/` directory; everything is in `index.ts`. Schema/column changes need a migration applied separately — deploy order: migration first, then function.

## Editing tips
- The file is mostly untyped JS-in-TS (`function foo(data)` with implicit any). Match that unless you're refactoring deliberately; Deno doesn't typecheck on deploy here.
- Add new columns to the `sites` select on line ~272 if the function needs them.
- Every early `return new Response` repeats the CORS + JSON headers; keep `corsHeaders` on all responses or browsers will block the beacon silently.
