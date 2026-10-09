# Global Rules

Hard constraints, conventions and known gotchas. Read before making any change.

## Do

- Keep TypeScript strict; reuse the interfaces in `src/lib/supabase.ts` (`Site`, `PageView`, `Session`, `AnalyticsEvent`, ...). Update them when you change columns.
- Query through the shared `supabase` client (`db: { schema: 'adhoc_analytics' }`). Never create a second client or use the service key in the browser.
- Match the existing component style: Tailwind utilities, lucide icons, cards as `bg-white rounded-xl shadow-sm border border-slate-200`, modals/drawers controlled by a boolean in the parent plus an `onClose` prop.
- New tables must have RLS enabled with owner-scoped SELECT policies (join through `sites.user_id = (select auth.uid())`).
- Functions that bypass RLS (`SECURITY DEFINER`) must set `search_path = ''`, schema-qualify every table, and check `auth.uid()` owns the site (see `delete_site_analytics_data`).
- Keep `public/analytics.js` dependency-free vanilla JS with no cookies; it runs on third-party sites, so a bug there breaks other people's pages. Wrap risky code defensively and never throw.
- Comments only for the *why* of non-obvious things.

## Do NOT

- Do not store anything in cookies or `localStorage` from the tracking script (privacy promise). `sessionStorage` session ID only.
- Do not log or persist secrets (MaxMind keys, proxy secret, service key). Never commit `.env`.
- Do not remove the `is_unload`, `excluded` or 404/400 branches in `track` without checking `analytics.js` behaviour — the script fires and forgets via `sendBeacon` and cannot react to responses.
- Do not break backwards compatibility of the beacon payload: sites in the wild run old copies of `analytics.js` cached from this origin, and the snippet itself is pasted into other people's sites.
- Do not paste Edge Function code into the Supabase dashboard (see Deploy).

## Deploy

**Frontend**: `npm run build`, deploy `dist/` to the static host (Netlify-style `_redirects`).

**Edge Function** (`supabase/functions/track`): deploy with the Supabase CLI, never the dashboard editor.
```bash
npx supabase functions list                       # check current verify_jwt first
npx supabase functions deploy track --use-api --no-verify-jwt
```
`track` is called by browsers on third-party sites with no Authorization header, so `verify_jwt` is expected to be off. Confirm the current setting via `functions list` before deploying and keep it unchanged. There is no `_shared/` directory today; if one is added, redeploy every function that imports it.

**Migrations** are applied separately from function deploys (see [../backend/migrations.md](../backend/migrations.md)).

## Hosting / proxy

Supabase for this app is self-hosted behind a reverse proxy. Supabase's gateway rewrites `X-Forwarded-For`, so the proxy sends the real client IP as `X-Client-IP`, trusted only when `X-Proxy-Secret` matches the `PROXY_SHARED_SECRET` secret. Without that pair the function falls back to `x-forwarded-for` / `x-real-ip` (which will usually be the proxy's IP). `analytics.js` defaults to `https://sb.cahs.cloud/functions/v1/track` if no `apiUrl` is configured.

## Known gotchas

1. **Schema name**: all app tables live in `adhoc_analytics`, not `public`. The schema must be exposed to PostgREST and granted to `anon`/`authenticated`/`service_role`. Both the SPA client and the Edge Function pass `db: { schema: 'adhoc_analytics' }`.
2. **Migration files are inconsistent about schema qualification** (some unqualified, some `public.`, one `adhoc_analytics.`). See [../backend/migrations.md](../backend/migrations.md). Verify against the live DB; do not assume the files replay cleanly from scratch.
3. **Service key secret name** is `default_supabase_secret_key`, not `SUPABASE_SERVICE_ROLE_KEY`.
4. **Deprecated tracking IDs** are hardcoded in `public/analytics.js` (`deprecatedSite`); the script exits immediately for them. These are the legacy SCA sites (commit "stop tracking SCA sites, even though they are disabled"); the guard stops the script client-side even though the sites are `active=false`. Don't remove it without confirming those sites no longer embed the snippet.
5. **`use_paid_geo` has no UI**: it exists on `Site` and in the DB but `ManageSiteModal` doesn't expose it. Flip it with SQL. `use_uaparser` likewise has no UI and isn't on the `Site` TS interface.
6. **Row limits**: dashboard stats count by fetching rows (`.select('id')` then `.length`). PostgREST's default row cap (commonly 1000) silently truncates busy sites/long ranges. Use `{ count: 'exact', head: true }` or an RPC if you need accurate large counts.
7. **Stale docs**: `README.md` (says geo is "coming soon", lists an old structure/migration set, mentions Netlify only) and `.github/copilot-instructions.md` (mentions `SUPABASE_SERVICE_ROLE_KEY`, "FOR ALL USING user_id" RLS example that doesn't match reality) are out of date. `.github` is gitignored. Trust `.ai/` and the code over them; update `README.md` when behaviour changes.
8. **Events path skips geo**: custom events insert into `events` before the geo lookup (no country/city on events). Link clicks store country only (no city).
9. **Session lookup is global**: the `track` function finds an existing session by `session_id` alone (not scoped to the site). Session IDs are random enough that this works, but don't rely on it for tenant isolation.
10. **`ip_geo_cache` SELECT policy is `USING (true)` for `authenticated`** — any logged-in user can read the whole cache. It holds no per-user data, but keep that in mind before adding sensitive columns.
