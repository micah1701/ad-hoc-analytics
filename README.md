# Ad-Hoc Analytics Production Website

A modern, privacy-focused web analytics platform built with React and Supabase. Track visitor behavior, page views, outbound links, file downloads and custom events in real-time with an intuitive dashboard interface.


- **Real-time Analytics**: Monitor active visitors and recent activity as it happens
- **Comprehensive Tracking**: Automatic tracking of page views, sessions, outbound links, and file downloads, plus custom events
- **Visitor Insights**: Sortable, filterable visitor list with detailed per-visitor timelines of page views and link clicks
- **Browser & Device Stats**: Browser, OS, device, rendering engine and CPU architecture breakdowns
- **Traffic Sources**: Understand where your visitors are coming from
- **Geographic Data**: Country and city per visitor via MaxMind GeoIP (free GeoLite by default, optional paid GeoIP with caching and IP detail view)
- **IP Exclusion**: Exclude your own traffic by IP address or CIDR range (IPv4 and IPv6) per site
- **Multi-Site Management**: Track multiple websites from a single dashboard, with a default site
- **Privacy-Focused**: Session-based analytics. No cookies, no `localStorage`, no cross-site identifiers. (Visitor IP addresses are stored with page views to support geolocation and IP exclusion.)

This branch is acting as the primary branch for the actively running website at analytics.ad-hoc.app

## For End Users

### How It Works

```
Website with tracking code
    ↓ (loads)
analytics.js from your-app-domain.com
    ↓ (sends tracking data via sendBeacon)
Supabase Edge Function: your-supabase-url/functions/v1/track
    ↓ (stores in)
Supabase Database (adhoc_analytics schema)
    ↓ (displays in)
Dashboard
```

### Getting Started

1.  **Sign Up / Sign In**

- Visit the analytics dashboard
- Create an account or sign in with your email and password

2.  **Add Your Website**

- Open the menu and click "Add Site" (or "Add Your First Site" on an empty dashboard)
- Enter your website name and domain
- Click "Add Site" to create your tracking profile

3.  **Install Tracking Code**

- Click "Manage Site" and open the "Install" tab
- Copy the provided tracking code
- Paste it in the `<head>` section of your website, before the closing `</head>` tag
- The code will look like this:

```html
<!-- Analytics Tracking Code -->
<script>
  window.ANALYTICS_CONFIG = {
    trackingId: "your-tracking-id",
    apiUrl: "https://your-supabase-url/functions/v1/track",
  };
</script>
<script src="https://your-app-url.com/analytics.js" defer></script>
```

4.  **Start Tracking**

- Once installed, your dashboard will start displaying data immediately
- View real-time activity in the "Real-time Activity" panel and the "Active Now" card
- Monitor page views, unique visitors, and engagement metrics

### Using the Dashboard

#### Overview Cards

- **Page Views**: Total number of pages viewed in the selected time range
- **Unique Visitors**: Number of sessions in the selected time range. Click to see a detailed list of all visitors
- **Avg. Duration**: Average session length (sessions with no measured duration, and single-page sessions longer than an hour, are ignored)
- **Active Now**: Sessions active in the last 5 minutes. Click to see only those visitors

#### Real-time Activity

- Shows the 10 most recent page views from the last 5 minutes (refreshes every 5 seconds)
- Click any activity to see that visitor's complete timeline
- View their journey through your site with timestamps

#### Top Pages

- See which pages are most popular (top 10)
- Track views and share of total per page

#### Top Links

- Monitor outbound link clicks and file downloads, shown in separate sections
- View click counts and unique visitors per link

#### Traffic Sources

- Understand where your visitors come from
- See referrer domains and direct traffic

#### Browser & Device Stats

- Track visitor browsers, operating systems and devices
- Collapsible sections for rendering engines and CPU architectures

#### Visitor List

- Click "Unique Visitors" or "Active Now" to open it
- Sort by page count, duration or last seen
- Filter by **US/Canada Only**, **Residential** (cable/DSL connections) and **Engaged** (more than one page, a measurable duration, or any event)
- Click a visitor to open their timeline of page views and link clicks
- Click an IP address to open the IP geolocation details drawer
- The US/Canada and Residential filters rely on cached MaxMind data, so they only apply to sites using paid geolocation

#### Manage Site

Click "Manage Site" on the dashboard:

- **Install**: tracking code snippet
- **Settings**: site name, domain, active toggle, "default site" toggle, and excluded IPs (one IP or CIDR range per line, e.g. `203.0.113.7` or `198.51.100.0/24`)
- **Danger zone**: see how many records a site has, and permanently delete all of its analytics data (type-to-confirm; the site itself is kept)

### Manual Tracking (Optional)

For JavaScript-triggered downloads or custom events that aren't automatically tracked:

```javascript
// Track a download triggered by JavaScript
window.analytics.trackDownload("https://example.com/file.pdf", "Report Name");

// Track an outbound link triggered by JavaScript
window.analytics.trackOutboundLink("https://example.com", "Link Text");
```

### Custom Event Tracking

Track custom user interactions and behaviors beyond page views and link clicks:

```javascript
// Track a button click
window.analytics.trackEvent("button_click", {
  button_name: "Sign Up",
  location: "hero_section",
});

// Track form submission
window.analytics.trackEvent("form_submit", {
  form_name: "contact_form",
  fields_completed: 5,
});

// Track e-commerce actions
window.analytics.trackEvent("add_to_cart", {
  product_id: "ABC123",
  product_name: "Premium Widget",
  price: 29.99,
  quantity: 1,
});
```

**Event Data Structure:**

- `event_name` (string): Descriptive name for the event (use lowercase with underscores)
- `event_data` (object): Any additional data you want to track (stored as JSON)

**Best Practices:**

- Use consistent naming conventions (e.g., `button_click`, `form_submit`)
- Keep event names descriptive and specific
- Include relevant context in event_data
- Avoid tracking sensitive or personally identifiable information
- Events are stored in the `events` table with the session ID. They are counted toward a visitor's "Engaged" status and are not geolocated

### Time Range Selection

Use the dropdown in the top-right to change the analytics time range:

- Last 24 Hours (default)
- Last 7 Days
- Last 30 Days

---

## For Developers

> AI-assistant and in-depth developer documentation lives in [`.ai/`](.ai/README.md) (start with `.ai/README.md`; `CLAUDE.md` points there too).

### Tech Stack

**Frontend:**

- React 19 with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Lucide React (icons)

**Backend:**

- Supabase (PostgreSQL database, in the `adhoc_analytics` schema)
- Supabase Edge Functions (serverless API, Deno)
- Supabase Authentication (email/password)
- MaxMind GeoIP / GeoLite web services (geolocation)

**Analytics Tracking:**

- Vanilla JavaScript tracking script (`public/analytics.js`)
- Automatic detection of page views, SPA navigation, links, and downloads
- Session-based tracking with no cookies

### Project Structure

```
project/
├── .ai/                          # In-depth docs for AI assistants / developers
├── CLAUDE.md                     # Entry point for Claude Code, points to .ai/
├── src/
│ ├── components/                 # React components
│ │ ├── AddSiteModal.tsx          # Modal for adding new sites
│ │ ├── Analytics.tsx             # Main analytics dashboard for a site
│ │ ├── Auth.tsx                  # Authentication UI
│ │ ├── BrowserStats.tsx          # Browser / OS / device / engine / CPU breakdowns
│ │ ├── Dashboard.tsx             # Top-level layout, site loading
│ │ ├── InstallCode.tsx           # Install code modal
│ │ ├── IpGeoDrawer.tsx           # Cached MaxMind details for an IP
│ │ ├── ManageSiteModal.tsx       # Install / settings / danger zone tabs
│ │ ├── MenuDrawer.tsx            # Site switcher, add site, sign out
│ │ ├── PageViewDrawer.tsx        # Visitor timeline drawer
│ │ ├── RealtimeVisitors.tsx      # Real-time activity list
│ │ ├── SiteList.tsx              # Site list
│ │ ├── StatCard.tsx              # Metric cards
│ │ ├── TopLinks.tsx              # Top links/downloads tables
│ │ ├── TopPages.tsx              # Top pages table
│ │ ├── TrafficSources.tsx        # Referrer sources
│ │ └── VisitorList.tsx           # Visitor list modal with filters
│ ├── contexts/
│ │ └── AuthContext.tsx           # Authentication context
│ ├── lib/
│ │ └── supabase.ts               # Supabase client, types, site/RPC helpers
│ ├── utils/
│ │ └── StringToColor.ts          # Deterministic color from a string
│ ├── App.tsx                     # Root component
│ ├── main.tsx                    # App entry point
│ └── index.css                   # Global styles
├── public/
│ ├── analytics.js                # Tracking script (deployed with app)
│ └── test-tracking.html          # Test page for tracking
├── supabase/
│ ├── functions/
│ │ └── track/
│ │   └── index.ts                # Edge function for tracking
│ └── migrations/                 # Database migrations
│   ├── 20251110000000_consolidated_analytics_setup.sql
│   ├── 20260306152836_add_excluded_ips_to_sites.sql
│   └── 20260319000000_ip_geo_cache.sql
├── maxmind.md                    # MaxMind web-service reference excerpt
├── MAXMIND-RRESPONSES.md         # MaxMind response field reference (large)
└── package.json
```

### Database Schema

All tables live in the `adhoc_analytics` schema.

**Tables:**

- `sites`: Website configurations (tracking ID, active, default, excluded IPs, UAParser and paid-geo flags)
- `sessions`: Visitor sessions with browser/OS/device and location metadata
- `page_views`: Individual page view records (includes visitor IP)
- `link_clicks`: Outbound links and file downloads
- `events`: Custom events
- `ip_geo_cache`: Cached MaxMind responses, used when a site has `use_paid_geo` enabled

**Functions:**

- `get_site_analytics_counts(uuid)` and `delete_site_analytics_data(uuid)` power the "Danger zone" tab
- A trigger keeps at most one default site per user

**Row Level Security (RLS):**

- All tables have RLS enabled
- Users can only read their own sites and the data belonging to them
- The Edge Function writes with a service-level key, bypassing RLS

### Installation & Setup

#### Prerequisites

- Node.js 18+ and npm
- A Supabase project (the app expects the `adhoc_analytics` schema to exist and be exposed to the API)
- Optional: a MaxMind account (GeoLite or GeoIP) for geolocation
- Git

#### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd project
npm install
```

#### 2. Environment Configuration

Create a `.env` file in the root directory (see `.env.example`):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-embed-key
```

Get the Supabase values from your project settings (Settings > API). `VITE_GOOGLE_MAPS_API_KEY` is optional: it powers the map in the IP details drawer, which is hidden when the key is missing. Vite bakes it into the build, so it is still visible to anyone using the dashboard; restrict it in Google Cloud Console by HTTP referrer and to the Maps Embed API.

#### 3. Database Setup

Migrations are in `supabase/migrations/` and are applied manually (there is no committed Supabase CLI config), for example with the SQL editor, `psql`, or the Supabase MCP. Apply them in filename order:

- `20251110000000_consolidated_analytics_setup.sql`: tables, indexes, RLS, RPC functions, default-site trigger
- `20260306152836_add_excluded_ips_to_sites.sql`: per-site IP exclusion
- `20260319000000_ip_geo_cache.sql`: paid-geo flag and `ip_geo_cache`

Note: the migration files are not consistent about schema qualification (`public.` vs `adhoc_analytics.`). Check them against your database before running them on a fresh project. See `.ai/backend/migrations.md`.

#### 4. Deploy Edge Function

The tracking endpoint is a Supabase Edge Function at `supabase/functions/track/index.ts`. Deploy it with the Supabase CLI (not by pasting into the dashboard):

```bash
npx supabase functions deploy track --use-api --no-verify-jwt
```

`--no-verify-jwt` is needed because tracked sites send beacons without a Supabase JWT.

Set these secrets on the Supabase project:

| Secret                                      | Purpose                                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `default_supabase_secret_key`               | Service-level key the function uses to write data                                                |
| `MAXMIND_ACCOUNT_ID`, `MAXMIND_LICENSE_KEY` | MaxMind credentials (geolocation is skipped if missing)                                          |
| `PROXY_SHARED_SECRET`                       | Optional. Shared secret that authenticates the `X-Client-IP` header from a trusted reverse proxy |

If Supabase sits behind a reverse proxy, the proxy should send the real visitor IP as `X-Client-IP` plus `X-Proxy-Secret` (matching `PROXY_SHARED_SECRET`), because Supabase's gateway rewrites `X-Forwarded-For`. Without that, the function falls back to `X-Forwarded-For` / `X-Real-IP`.

#### 5. Development

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

#### 6. Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

**Important:** Make sure the `public/analytics.js` file is accessible at your deployed URL (e.g., `https://yourdomain.com/analytics.js`). This script needs to be referenced in the tracking code you give to users, and the install snippet uses the dashboard's own origin for it.

### Development Scripts

```bash
npm run dev  # Start development server
npm run build  # Build for production
npm run preview  # Preview production build
npm run lint  # Run ESLint
npm run typecheck  # Run TypeScript type checking
```

### Key Implementation Details

#### Analytics Tracking Script

The `public/analytics.js` file is a self-contained tracking script that:

- Generates unique session IDs stored in sessionStorage
- Tracks page views automatically on load and on URL changes (detected with a `MutationObserver`)
- Sends an "unload" beacon on `beforeunload` to record exit time and session duration
- Detects and tracks outbound links and file downloads
- Sends data to the Supabase Edge Function via the `sendBeacon` API (falling back to `fetch` with `keepalive`)
- Works without cookies for privacy compliance
- Skips a hardcoded list of deprecated tracking IDs

#### Edge Function Behavior

The `track` function:

- Looks up the site by `tracking_id` (404 if unknown or inactive)
- Parses the User-Agent with `ua-parser-js` (or simple regexes if the site has `use_uaparser` off)
- Resolves the client IP and silently drops requests from the site's excluded IPs/CIDR ranges
- Looks up country and city with MaxMind. Sites with `use_paid_geo` use the paid endpoint and cache results in `ip_geo_cache`; other sites use free GeoLite with no caching
- Writes to `sessions`, `page_views`, `link_clicks` or `events` depending on the payload

Browser, OS, device and location are recorded once per session, when it is created.

#### Authentication Flow

- Uses Supabase Auth with email/password
- Auth state managed via React Context (`AuthContext.tsx`)
- Unauthenticated users see the sign-in screen; there is no router
- Automatic session persistence

#### Real-time Updates

- Overview stat cards refresh every 30 seconds
- Real-time activity refreshes every 5 seconds
- Other widgets (top pages, links, sources, browser stats) reload when the site or time range changes
- Active visitors are sessions with `last_seen` within 5 minutes

#### File Download Detection

The tracking script detects file downloads by:

1. File extensions (PDF, DOC, ZIP, images, media, CSV/JSON, etc.)
2. URL query parameters or hash containing "download" or "attachment"
3. HTML5 `download` attribute on links
4. Manual API calls via `window.analytics.trackDownload()`

### Troubleshooting

**Tracking Not Working:**

1. Verify the tracking script URL is correct and accessible
2. Check browser console for errors (`Analytics: No tracking ID provided` means the snippet config is missing)
3. In the Network tab, check the POST to `/functions/v1/track`: `404` means a wrong tracking ID or an inactive site; `200` with `"excluded": true` means the visitor's IP is on the excluded list
4. Ensure the Edge Function is deployed and the API URL is correct
5. Verify CORS headers are set correctly in the Edge Function and not stripped by a proxy

**No Data Showing:**

1. Check that the tracking ID matches between script and dashboard
2. Verify RLS policies allow reading data and that you're signed in as the site's owner
3. Ensure sessions and page_views are being created in the `adhoc_analytics` schema
4. Confirm the `adhoc_analytics` schema is exposed in the Supabase API settings

**Location Missing or Wrong:**

1. Confirm the MaxMind secrets are set
2. If every visitor shows the same location, the proxy is probably not forwarding `X-Client-IP` / `X-Proxy-Secret` correctly
3. Private or reserved IP addresses have no MaxMind data

**Build Errors:**

1. Run `npm run typecheck` to check for TypeScript errors
2. Ensure all dependencies are installed (`npm install`)
3. Check that environment variables are set correctly

### Contributing

When adding new features:

1. Follow the existing component structure
2. Use TypeScript for type safety
3. Update RLS policies if adding new tables
4. Test tracking script changes thoroughly
5. Document any new manual tracking APIs
6. Keep `.ai/` documentation in sync with behaviour changes

### Security Notes

- Never expose the Supabase service key in client-side code
- All client-side requests use the anon key
- RLS policies enforce user data isolation
- The Edge Function uses a service-level key for write operations
- Visitor IP addresses are stored with page views; no other personal data is collected. Don't send personal data in custom events

## Author

Micah Murray [@micah1701](https://github.com/micah1701)
