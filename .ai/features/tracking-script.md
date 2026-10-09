# Tracking Script (`public/analytics.js`)

Self-contained IIFE, vanilla JS, served as a static file from the dashboard's origin. Embedded on third-party sites via:
```html
<script>
  window.ANALYTICS_CONFIG = { trackingId: "<tracking_id>", apiUrl: "<supabase>/functions/v1/track" };
</script>
<script src="<dashboard-origin>/analytics.js" defer></script>
```
`apiUrl` falls back to `https://sb.cahs.cloud/functions/v1/track`. No `trackingId` → logs an error and does nothing.

## Behaviour
| Concern | How |
|---|---|
| Session ID | `sess_<Date.now()>_<random>` in `sessionStorage['analytics_session_id']`. New tab/window = new session. No cookies, no localStorage |
| Transport | `navigator.sendBeacon(url, JSON.stringify(data))`; falls back to `fetch(..., {keepalive:true})`. Beacon string body ⇒ `text/plain`, which avoids a CORS preflight; the function does `req.json()` anyway |
| Page view | Sent immediately on load |
| SPA navigation | `MutationObserver` on `document` compares `location.href` to the last URL and re-sends a page view when it changes (no History API patching) |
| Exit | `beforeunload` sends the page payload with `is_unload: true` → server sets `exit_timestamp`, extends session duration, doesn't count a new page |
| Link clicks | Capture-phase `click` and middle-button `auxclick` listeners walk up to the nearest `<a>`. Classified as `file_download` if the URL has a known file extension (pdf, docx, zip, images, media, csv/json/xml/txt/log, exe/dmg/pkg/deb/rpm, iso/img…), a `download`/`attachment` query/hash, or the anchor has a `download` attribute; else `outbound` if hostname ≠ `location.hostname`. Internal non-file links are not tracked. Text truncated to 200 chars |
| Deprecated sites | Hardcoded `deprecatedSite` tracking IDs → script returns immediately |

## Page payload (`getPageData`)
`tracking_id, session_id, page_url (full href), page_title, referrer, screen_width, screen_height, language`. The server adds UA (from header), IP and geo.

## Public API (`window.analytics`)
```js
analytics.trackEvent(name, dataObject)        // → events table
analytics.trackDownload(fileUrl, fileName?)   // → link_clicks, type file_download
analytics.trackOutboundLink(url, linkText?)   // → link_clicks, type outbound
```
Event naming convention in docs: lowercase_with_underscores; don't send PII.

## Editing rules
- Output is cached by browsers/CDNs on customer sites you don't control — keep the payload backward compatible with the Edge Function, and make new fields optional server-side.
- Must never throw into the host page; guard new code with try/catch like `isFileDownload`.
- `public/test-tracking.html` is a manual test page for the script.
