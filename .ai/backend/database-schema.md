# Database Schema

Schema: **`adhoc_analytics`** (on a Supabase instance shared with other projects). Source of truth for definitions: `supabase/migrations/`. Check the live DB if in doubt (see [migrations.md](migrations.md) for why).

## Tables

### `sites`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | `gen_random_uuid()` |
| user_id | uuid → auth.users | ON DELETE CASCADE, owner |
| name, domain | text NOT NULL | |
| tracking_id | text UNIQUE NOT NULL | default `encode(gen_random_bytes(12),'base64')`; public, embedded in snippet. Can contain `+` and `/` |
| active | boolean | default true; `track` ignores inactive sites (404) |
| use_uaparser | boolean | default true; false = crude regex UA parsing |
| is_default | boolean | default NULL; trigger keeps at most one TRUE per user |
| excluded_ips | text[] | default `{}`; IPs/CIDRs dropped by `track` |
| use_paid_geo | boolean | default false; true = MaxMind paid endpoint + `ip_geo_cache` |
| created_at | timestamptz | |

### `sessions` (one row per `session_id`, aggregated)
`id`, `site_id`→sites, `session_id` (text UNIQUE), `first_seen`, `last_seen`, `page_count`, `duration_seconds`, `entry_page`, `exit_page`, `referrer`, `browser` ("Chrome 120"), `os`, `device_type` (`mobile`|`desktop`; tablets map to mobile), `country` (ISO code), `city` ("Austin, TX"), plus UAParser extras: `browser_version`, `os_version`, `device_vendor`, `device_model`, `engine_name`, `engine_version`, `cpu_architecture`.

Browser/OS/device/geo columns are written **only on session insert** (first hit); later hits only update `last_seen`, `page_count`, `duration_seconds`, `exit_page`.

### `page_views`
`id`, `site_id`, `session_id`, `page_url`, `page_title`, `referrer`, `user_agent`, `ip_address` (**inet**), `country`, `city`, `screen_width`, `screen_height`, `language`, `timestamp`, `exit_timestamp` (set by the unload beacon on the latest matching view).

### `link_clicks`
`id`, `site_id`, `session_id`, `page_url`, `link_url`, `link_text`, `link_type` (CHECK `outbound`|`file_download`), `timestamp`, `country`, `created_at`.

### `events`
`id`, `site_id`, `session_id`, `event_name`, `event_data` (jsonb), `timestamp`. Fed by `window.analytics.trackEvent`.

### `ip_geo_cache`
Keyed by `ip_address inet` (PK). Flattened MaxMind City Plus response: `continent_*`, `country_iso_code/name/is_eu`, `registered_country_*`, `city_geoname_id/name`, `postal_code`, `subdivisions` (jsonb `[{iso_code,name}]`), `location_latitude/longitude/accuracy_radius/time_zone`, `traits_*` (ASN, org, connection type, domain, ISP, network, anycast), plus `last_updated`, `last_lookup`, `lookup_count`. Indexed on `country_iso_code` and `last_updated`. No expiry/refresh logic exists. Only populated for sites with `use_paid_geo = true`.

## Indexes
`page_views(site_id, timestamp DESC)`; `sessions(site_id, first_seen DESC)`; partial indexes on sessions for `browser_version`, `os_version`, `device_vendor`, `engine_name`; `events(site_id)`; `link_clicks(site_id)`, `link_clicks(session_id, timestamp)`.

There is **no** index on `sessions(last_seen)` (used for "active now") and none on `page_views(session_id)`.

## RLS
Enabled on every table.
- `sites`: owner-only SELECT/INSERT/UPDATE/DELETE via `(select auth.uid()) = user_id`.
- `page_views`, `sessions`, `events`, `link_clicks`: SELECT allowed when the row's site belongs to `auth.uid()` (EXISTS subquery on `sites`).
- INSERT (and UPDATE for sessions) policies named "Service role can ..." are `TO authenticated WITH CHECK (true)` — the name is misleading; the Edge Function actually bypasses RLS with its service key. Note this means any *authenticated* user could insert rows for any site via PostgREST. Don't copy this pattern for new tables; keep writes service-role only.
- `ip_geo_cache`: authenticated SELECT/INSERT/UPDATE with `true`.

## Functions & triggers
| Name | Purpose |
|---|---|
| `set_others_sites_default_to_false()` + triggers `trigger_set_others_sites_default_to_false` (BEFORE UPDATE OF is_default) and `..._insert` (BEFORE INSERT) | When a site is set `is_default = true`, sets the user's other sites to false |
| `get_site_analytics_counts(p_site_id uuid) → jsonb` | `{success, counts:{link_clicks,events,sessions,page_views,total}}`; SECURITY DEFINER, checks ownership. Called from `getAnalyticsCounts` |
| `delete_site_analytics_data(p_site_id uuid) → jsonb` | Deletes all link_clicks/events/sessions/page_views for a site (not the site itself) and returns counts. Called from `deleteSiteAnalytics`; EXECUTE granted to `authenticated` |

Both RPCs reference `public.<table>` inside the body — see the schema caveat in [migrations.md](migrations.md).

## Relationships
```
auth.users 1─* sites 1─* sessions   (sessions.session_id is the logical key for the rows below)
                    1─* page_views
                    1─* link_clicks
                    1─* events
page_views.ip_address ~ ip_geo_cache.ip_address   (soft join, done client-side)
```
`session_id` links page_views/link_clicks/events to sessions logically; there is no FK.
