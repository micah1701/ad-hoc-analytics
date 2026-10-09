# Geolocation (MaxMind)

Implemented in `supabase/functions/track/index.ts` (`callMaxMind`, `flattenMaxMindResponse`, `lookupGeo`, `formatCity`). Controlled per site by `sites.use_paid_geo`.

| | Free (default, `use_paid_geo = false`) | Paid (`use_paid_geo = true`) |
|---|---|---|
| Endpoint | `https://geolite.info/geoip/v2.1/city/{ip}` | `https://geoip.maxmind.com/geoip/v2.1/city/{ip}` (City Plus) |
| Cache | none — one HTTP call per tracked request that reaches the geo step | `adhoc_analytics.ip_geo_cache`, keyed by IP; hit updates `last_lookup`/`lookup_count`, miss calls MaxMind and inserts the flattened row |
| Stored on session/page view | `country` = ISO code, `city` = `"City, ST"` (first subdivision ISO code) | same |
| Extra data | none persisted | full flattened response (ISP, ASN, connection type, lat/long, time zone…) used by the Visitor List filters and IP Geo drawer |

Auth: HTTP Basic with `MAXMIND_ACCOUNT_ID:MAXMIND_LICENSE_KEY`. Missing creds or any non-2xx / exception ⇒ `{country:null, city:null}` and a `console.error`; tracking continues without geo.

## Where geo is (not) applied
- Applied for page views and link clicks (link clicks only keep `country`).
- **Not** applied for custom events (they return earlier).
- Not applied when the IP is excluded or unparseable (`ip` is null → no lookup).
- Session geo is set once, at session creation.

## UI
- `VisitorList` shows city and uses cached rows for two filters: *US/Canada Only* (`country_iso_code`) and *Residential* (`traits_connection_type === 'Cable/DSL'`). Both only work for paid-geo sites because free lookups aren't cached.
- `IpGeoDrawer` opens from an IP in the visitor list and shows the cached row.
- Cache rows never expire; if you want refresh, add logic keyed on `last_updated`.

## Enabling paid geo for a site
No UI. Run SQL: `update adhoc_analytics.sites set use_paid_geo = true where id = '<site id>';` Then the next new IP is fetched from the paid endpoint and cached.

## Reference docs
`maxmind.md` (auth, endpoints, errors) and `MAXMIND-RRESPONSES.md` (field reference, very long — grep). Real-world response shape matters when changing `flattenMaxMindResponse`; `ip_geo_cache` columns mirror its output one-to-one.
