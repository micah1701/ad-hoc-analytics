# .ai — AI Context System for Ad-Hoc Analytics

A layered documentation system for AI-assisted development on the Ad-Hoc Analytics platform. Read this index first, then navigate to the file most relevant to your current task.

---

## How to Use This

- **New to the project?** Start with [`global/project-overview.md`](global/project-overview.md), then [`global/tech-stack.md`](global/tech-stack.md)
- **Changing what gets recorded?** See [`backend/track-function.md`](backend/track-function.md) and [`features/tracking-script.md`](features/tracking-script.md)
- **Touching the database?** See [`backend/database-schema.md`](backend/database-schema.md) and [`backend/migrations.md`](backend/migrations.md)
- **Touching the dashboard UI?** See [`frontend/app-structure.md`](frontend/app-structure.md) and [`frontend/data-fetching.md`](frontend/data-fetching.md)
- **Adding something new?** Pick the relevant [`skills/`](skills/) recipe
- **Before any edit:** skim [`global/rules.md`](global/rules.md) (includes known gotchas and stale docs)

---

## Index

### Global
| File | What it covers |
|---|---|
| [`global/project-overview.md`](global/project-overview.md) | What the product is, data flow, key concepts, hosting, current status |
| [`global/rules.md`](global/rules.md) | Conventions, forbidden patterns, deploy rules, **known gotchas** |
| [`global/tech-stack.md`](global/tech-stack.md) | Libraries, services, scripts, env vars and secrets |

### Backend
| File | What it covers |
|---|---|
| [`backend/database-schema.md`](backend/database-schema.md) | `adhoc_analytics` schema: every table/column, RLS, RPC functions, triggers |
| [`backend/track-function.md`](backend/track-function.md) | The `track` Edge Function: request shapes, branches, IP handling, secrets, deploy |
| [`backend/migrations.md`](backend/migrations.md) | Migration history, schema-qualification inconsistencies, how they get applied |

### Frontend
| File | What it covers |
|---|---|
| [`frontend/app-structure.md`](frontend/app-structure.md) | Component tree, what each component does, auth flow |
| [`frontend/data-fetching.md`](frontend/data-fetching.md) | Supabase client queries per component, polling intervals, time ranges, metric definitions |

### Features
| File | What it covers |
|---|---|
| [`features/tracking-script.md`](features/tracking-script.md) | `public/analytics.js`: session IDs, SPA detection, link/download detection, public JS API |
| [`features/geolocation.md`](features/geolocation.md) | MaxMind GeoLite vs paid GeoIP, `ip_geo_cache`, IP Geo drawer, reference docs |
| [`features/ip-exclusion.md`](features/ip-exclusion.md) | Per-site excluded IPs/CIDRs, IPv6 parsing, reverse-proxy client IP header |

### Skills (Step-by-Step Recipes)
| File | When to use |
|---|---|
| [`skills/add-migration.md`](skills/add-migration.md) | Creating and applying a database migration |
| [`skills/add-site-setting.md`](skills/add-site-setting.md) | Adding a per-site setting (column → type → UI → Edge Function) |
| [`skills/add-dashboard-widget.md`](skills/add-dashboard-widget.md) | Adding a new stats card/table to the dashboard |
| [`skills/debug-tracking.md`](skills/debug-tracking.md) | Diagnosing "no data showing" / wrong data |
