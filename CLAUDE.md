# CLAUDE.md — Ad-Hoc Analytics

**Start here:** Read [`.ai/README.md`](.ai/README.md) for a navigable index of project documentation. The `.ai/` folder covers the data flow, database schema, the `track` Edge Function, the tracking script, geolocation, the dashboard UI, and step-by-step recipes. Go to the file relevant to your task rather than re-deriving it from source.

## What This Is

A privacy-focused, cookie-less web analytics platform. A snippet (`public/analytics.js`) on tracked sites beacons to a Supabase Edge Function (`supabase/functions/track`), which writes to the `adhoc_analytics` Postgres schema; a React + Vite + Tailwind dashboard reads it back under RLS.

## Quick Reference

```bash
npm run dev         # http://localhost:5173
npm run build
npm run typecheck   # run after frontend changes
npm run lint
```

- No tests, no router, no local Supabase stack.
- App tables live in schema `adhoc_analytics` (not `public`); the Supabase client is configured for it.
- Read [`.ai/global/rules.md`](.ai/global/rules.md) before editing — it lists known gotchas and stale docs (`README.md`, `.github/copilot-instructions.md`).
- Edge Function changes: deploy with the Supabase CLI (`npx supabase functions deploy track --use-api --no-verify-jwt`), never the dashboard. Migrations are applied separately.
- Keep `.ai/` up to date when you change behaviour.
