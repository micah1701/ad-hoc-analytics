# Skill: Add a Per-Site Setting

Worked examples already in the code: `excluded_ips` (full stack, with UI) and `use_paid_geo` (DB + function, no UI).

1. **Migration** — add the column to `adhoc_analytics.sites` with a safe default so existing rows behave as before. See [add-migration.md](add-migration.md).
2. **Type** — add the field to `Site` in `src/lib/supabase.ts`; add it to the `updates` type of `updateSite` if the UI edits it.
3. **UI** — `src/components/ManageSiteModal.tsx`, Settings tab: add `useState` initialised from `site.<field>`, an input, and include it in the `updateSite(site.id, {...})` call in the save handler. After save the parent refreshes sites via `onSiteUpdated` → `Dashboard.loadSites`.
4. **Edge Function** — if tracking behaviour depends on it, add the column to the `.select('id, active, ...')` on the site lookup in `supabase/functions/track/index.ts` and use it. Always handle `null` (`site.x ?? default`) because rows may predate the column.
5. **Docs** — update [../backend/database-schema.md](../backend/database-schema.md) and any feature doc.
6. **Hand-off** — remind the user: apply the migration first, then deploy `track` with the CLI (`npx supabase functions deploy track --use-api --no-verify-jwt`; check `functions list` for the current `verify_jwt` first), then ship the frontend build.
