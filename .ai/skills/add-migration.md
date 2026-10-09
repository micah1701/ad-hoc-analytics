# Skill: Add a Database Migration

1. **Inspect the live schema first** (Supabase MCP `list_tables`, or `\d adhoc_analytics.<table>`). Old migration files are not a reliable picture — see [../backend/migrations.md](../backend/migrations.md).
2. Create `supabase/migrations/<YYYYMMDDHHMMSS>_<snake_case_name>.sql`. Use a timestamp later than the newest file.
3. Qualify everything with `adhoc_analytics.` and make it idempotent:
   ```sql
   ALTER TABLE adhoc_analytics.sites ADD COLUMN IF NOT EXISTS my_flag boolean DEFAULT false;
   CREATE TABLE IF NOT EXISTS adhoc_analytics.my_table (...);
   ```
4. New table checklist:
   - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
   - Owner-scoped SELECT policy via `sites.user_id = (select auth.uid())`
   - Writes only through the Edge Function (service key) — don't add `WITH CHECK (true)` insert policies
   - `GRANT` to `anon`/`authenticated`/`service_role` as needed (the schema is custom, so default privileges may not cover it; see `ip_geo_cache` migration)
   - Indexes on `site_id` + time columns you filter on
5. `SECURITY DEFINER` functions: `SET search_path = ''`, fully qualified names, verify `auth.uid()` owns the site, `GRANT EXECUTE ... TO authenticated`.
6. Start the file with a block comment describing the change and why (existing style).
7. Update `src/lib/supabase.ts` interfaces and [../backend/database-schema.md](../backend/database-schema.md) + [../backend/migrations.md](../backend/migrations.md).
8. **Tell the user** the migration has to be applied to the database (it is not applied by committing or by deploying functions) and, if the `track` function reads the new column, to apply it *before* deploying the function.
