# Frontend App Structure

React 19 + TypeScript SPA. Entry `src/main.tsx` → `App.tsx`. There is **no router**; screens are chosen by state.

```
App
└─ AuthProvider (contexts/AuthContext.tsx)
   └─ AppContent: loading → spinner; user ? <Dashboard/> : <Auth/>
      Dashboard
      ├─ header (logo, Menu button)
      ├─ empty state "Add Your First Site"  (when no sites)
      ├─ Analytics (site)                   ← the main screen, one site at a time
      │   ├─ StatCard ×4  (Page Views, Unique Visitors*, Avg. Duration, Active Now*)   *clickable → VisitorList
      │   ├─ RealtimeVisitors   → click row → PageViewDrawer
      │   ├─ TopPages, TopLinks, TrafficSources, BrowserStats
      │   ├─ VisitorList (modal)  → PageViewDrawer / IpGeoDrawer
      │   └─ ManageSiteModal (tabs: install | settings | danger)
      ├─ AddSiteModal
      └─ MenuDrawer (site switcher, add site, sign out)
```

## Components (`src/components/`)
| Component | Role |
|---|---|
| `Auth` | Email/password sign in / sign up toggle using `useAuth()` |
| `Dashboard` | Loads all the user's sites, picks the default (`is_default`) or first, owns Add/Menu state, inserts new sites |
| `Analytics` | Per-site page: time range select (`24h|7d|30d`), stat cards (30s poll), composes the widgets, opens VisitorList/ManageSiteModal |
| `StatCard` | Presentational metric card, optional `onClick` |
| `RealtimeVisitors` | Last 10 page views from the last 5 min; polls every 5s |
| `TopPages` | Top 10 `page_url` by views |
| `TopLinks` | Outbound vs download link tables, per-URL clicks + unique sessions, expand/show-all toggles |
| `TrafficSources` | Referrer hostnames from `sessions.referrer` (`www.` stripped; empty = "Direct") |
| `BrowserStats` | Collapsible breakdowns of browser, OS, device, engine, CPU arch from `sessions` |
| `VisitorList` | Modal table of sessions; sortable (`page_count`, `avg_duration`, `last_seen`); filters **US/Canada Only**, **Residential** (`traits_connection_type = 'Cable/DSL'`), **Engaged**; `filterActiveOnly` prop = last 5 min; copy session ID / IP; row click → PageViewDrawer; IP click → IpGeoDrawer |
| `PageViewDrawer` | Per-session timeline merging page views and link clicks, with time-between-actions |
| `IpGeoDrawer` | Reads full `ip_geo_cache` row for an IP and renders location/network traits |
| `ManageSiteModal` | **Install** tab (snippet + copy), **Settings** (name, domain, active, default site, excluded IPs textarea → array), **Danger** (live row counts via RPC, type-to-confirm delete of all analytics data) |
| `InstallCode` | Standalone install-snippet modal (largely duplicated by ManageSiteModal's Install tab) |
| `AddSiteModal` | Name + domain form |
| `MenuDrawer` | Slide-in drawer, Escape closes, toggles `menu-open` class on `<body>` |

`src/utils/StringToColor.ts` — deterministic color from a string (visitor/session badges).

## Auth
`AuthContext` wraps `supabase.auth` (`getSession`, `onAuthStateChange`, `signInWithPassword`, `signUp`, `signOut`) and exposes `{ user, loading, signIn, signUp, signOut }`. Because the Supabase client has a custom `db.schema`, auth is unaffected (auth lives in the `auth` schema). Authorization is entirely RLS; the UI does no role checks.

## Install snippet
Generated in `InstallCode`/`ManageSiteModal` from `VITE_SUPABASE_URL` (`apiUrl = <url>/functions/v1/track`) and `window.location.origin` (script `src = <origin>/analytics.js`). If the dashboard origin changes, every pasted snippet's script URL is wrong — keep `analytics.js` at a stable origin.

## Conventions
- Props: `site` (full `Site`) or `siteId`; modals take `onClose`; `timeRange: '24h' | '7d' | '30d'`.
- No loading skeletons for widgets (render empty, fill when data arrives). `VisitorList` has a `loading` flag.
- Types shared via `src/lib/supabase.ts`; several components also declare local row interfaces.
