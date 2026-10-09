# IP Exclusion & Client IP Resolution

Lets a site owner stop counting their own traffic (office/home IPs). Logic lives in `track/index.ts`; UI is the **Settings** tab of `ManageSiteModal`.

## Config
`sites.excluded_ips text[]`. In the UI it is a textarea, one entry per line, split into an array on save (`updateSite` in `lib/supabase.ts`). Entries are single addresses or CIDR ranges, IPv4 or IPv6:
```
203.0.113.7
198.51.100.0/24
2001:db8::/32
```

## Matching (`parseIp` / `ipMatches`)
- `parseIp` handles IPv4, IPv6 incl. `::` compression, embedded IPv4 tails, bracketed `[::1]`, zone IDs (`%eth0` stripped). Returns `{version, value: bigint}` or `null` if invalid.
- IPv4-mapped IPv6 (`::ffff:a.b.c.d`) is normalised to plain IPv4, so an IPv4 exclusion matches it.
- `ipMatches` requires the same family, then compares the top `bits` bits (`value >> (width − bits)`). No `/bits` ⇒ exact match. Invalid entries just never match.
- Excluded requests return `200 {success:true, excluded:true}` and write nothing — including session, page view, link click and event.

## Client IP source (`getClientIp`)
Supabase's gateway rewrites `X-Forwarded-For`, so the trusted reverse proxy supplies the real IP:
1. If secret `PROXY_SHARED_SECRET` is set **and** the request has `X-Client-IP` **and** `X-Proxy-Secret` equals the secret → use `X-Client-IP`.
2. Otherwise first entry of `X-Forwarded-For`, else `X-Real-IP`.

The proxy must therefore set both headers, and `PROXY_SHARED_SECRET` must match on the proxy and in the Edge Function secrets. If exclusion or geo suddenly "stops working", check this pair first (CORS preflight does not matter; it's a server-side header from the proxy).

## Unparseable IPs
Anything `parseIp` can't parse is nulled before DB insert so it can't violate the `inet` column. Those requests are still tracked, just without IP/geo and never excluded.
