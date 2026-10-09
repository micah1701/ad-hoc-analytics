# Tech Stack

## Frontend
| Piece | Version | Notes |
|---|---|---|
| React | 19 | Function components + hooks only |
| TypeScript | 5.5, `strict: true` | `tsconfig.app.json` |
| Vite | 6 | `@vitejs/plugin-react`; `lucide-react` excluded from optimizeDeps |
| Tailwind CSS | 3.4 | Utility classes only; slate palette |
| lucide-react | icons | |
| @supabase/supabase-js | 2.57 | Single client in `src/lib/supabase.ts` |

No router, no Redux/Zustand, no charting library, no test runner.

## Backend
| Piece | Notes |
|---|---|
| Supabase (Postgres, Auth, Edge Functions) | Self-hosted instance shared with other projects; this app owns the `adhoc_analytics` schema |
| Edge Function `track` | Deno; imports `npm:@supabase/supabase-js@2.57.4` and `npm:ua-parser-js@2.0.6` |
| MaxMind | GeoLite web service (free) or GeoIP City Plus (paid), called from the Edge Function |
| Reverse proxy | Fronts Supabase (`/functions/v1` catch-all); forwards real client IP via `X-Client-IP` + `X-Proxy-Secret` |

## Scripts (`package.json`)
```bash
npm run dev        # Vite dev server, http://localhost:5173
npm run build      # production build to dist/
npm run preview    # serve the production build
npm run lint       # eslint .
npm run typecheck  # tsc --noEmit -p tsconfig.app.json
```
Run `npm run typecheck` and `npm run lint` after frontend changes; there are no tests to run.

## Environment

Frontend (`.env`, gitignored; template in `.env.example`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Edge Function secrets (set on the Supabase instance, never committed):
| Secret | Used for |
|---|---|
| `SUPABASE_URL` | built-in |
| `default_supabase_secret_key` | service-role-level key the function writes with (**not** the conventional `SUPABASE_SERVICE_ROLE_KEY` name) |
| `MAXMIND_ACCOUNT_ID`, `MAXMIND_LICENSE_KEY` | MaxMind basic auth |
| `PROXY_SHARED_SECRET` | authenticates the proxy's `X-Client-IP` header |

## Static hosting
`public/_redirects` is Netlify-format: `/analytics.js` passes through, everything else rewrites to `/index.html` (SPA fallback). `analytics.js` is served from the same origin as the dashboard because the install snippet is built from `window.location.origin`.

## Reference docs in repo root
- `maxmind.md` — excerpt of MaxMind web-service docs (auth, endpoints, errors).
- `MAXMIND-RRESPONSES.md` — 2.5k-line dump of MaxMind response/field docs. Large; grep it, don't read it whole.
