# Migrations

Location: `supabase/migrations/`, timestamp-prefixed (`YYYYMMDDHHMMSS_name.sql`). No Supabase CLI project config (`config.toml`) is committed, so there is no local stack; migrations are applied to the remote/self-hosted DB by hand (SQL editor, `psql`, or the Supabase MCP `apply_migration`). **Applying a migration is always a separate step from deploying the Edge Function** — remind the user to do it.

## History
| File | What it did |
|---|---|
| `20251110000000_consolidated_analytics_setup.sql` | Collapsed all earlier migrations into one: tables `sites`, `page_views`, `sessions`, `events`, `link_clicks`; indexes; RLS policies; RPCs `delete_site_analytics_data`, `get_site_analytics_counts`; default-site trigger |
| `20260306152836_add_excluded_ips_to_sites.sql` | Adds `sites.excluded_ips text[] DEFAULT '{}'` (guarded by `information_schema` check) |
| `20260319000000_ip_geo_cache.sql` | Adds `sites.use_paid_geo`; creates `ip_geo_cache` with indexes, grants (anon/authenticated/service_role) and RLS |

## ⚠️ Schema qualification is inconsistent
The app runs in schema `adhoc_analytics`, but the files disagree:
- The consolidated migration uses **unqualified** names for tables/policies/triggers (relies on whatever `search_path`/current schema it was run under), but the RPC bodies reference `public.sites`, `public.link_clicks`, etc. with `SET search_path = ''`.
- The `excluded_ips` migration checks/alters `public.sites`.
- The `ip_geo_cache` migration uses explicit `adhoc_analytics.` everywhere.

So these files likely do not replay cleanly into a fresh database by themselves, and the live DB may differ from them (not verified; no live inspection was done when this doc was written). Before writing a migration:
1. Inspect the live DB (`list_tables`, or `\d adhoc_analytics.sites`).
2. Write **new** migrations with explicit `adhoc_analytics.` qualification (follow `ip_geo_cache`).
3. Do not "fix" old migration files retroactively unless asked — they are history.
4. If RPCs misbehave ("Site not found" for a valid owner), check whether the live function body points at `public.` or `adhoc_analytics.`.

Recipe: [../skills/add-migration.md](../skills/add-migration.md).
