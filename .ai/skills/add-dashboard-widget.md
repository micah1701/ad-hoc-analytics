# Skill: Add a Dashboard Widget

Template: `src/components/TopPages.tsx` (simplest) or `TrafficSources.tsx`.

1. Create `src/components/MyWidget.tsx` with props `{ siteId: string; timeRange: '24h' | '7d' | '30d' }`.
2. Fetch in a `useEffect([siteId, timeRange])`; copy the standard cutoff block (see [../frontend/data-fetching.md](../frontend/data-fetching.md)) and query with `.eq('site_id', siteId).gte('<ts column>', cutoff.toISOString())`. Select only the columns you need. Aggregate in the component.
3. Card markup: `bg-white rounded-xl shadow-sm border border-slate-200`, header `p-6 border-b border-slate-200` with a lucide icon + `text-lg font-semibold text-slate-900` title.
4. Render it in `src/components/Analytics.tsx` alongside the other widgets.
5. If it needs live updates, add `setInterval` with cleanup (30s for stats, 5s only for real-time activity).
6. If the query could return > ~1000 rows, don't count client-side — use `{ count: 'exact', head: true }` or add an RPC (migration).
7. `npm run typecheck && npm run lint`.
8. Update [../frontend/app-structure.md](../frontend/app-structure.md) and the table in `data-fetching.md`.
