import { useState, useEffect } from 'react';
import { X, ArrowUpDown, ArrowUp, ArrowDown, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PageViewDrawer from './PageViewDrawer';
import IpGeoDrawer from './IpGeoDrawer';

interface VisitorListProps {
  siteId: string;
  timeRange: '24h' | '7d' | '30d';
  onClose: () => void;
  filterActiveOnly?: boolean;
}

interface VisitorStats {
  session_id: string;
  page_count: number;
  ip_address: string | null;
  city: string | null;
  avg_duration: number;
  first_seen: string;
  last_seen: string;
  browser: string | null;
  browser_version: string | null;
  os: string | null;
  os_version: string | null;
  device_vendor: string | null;
  device_model: string | null;
  engine_name: string | null;
  cpu_architecture: string | null;
  country: string | null;
  country_code: string | null;
  connection_type: string | null;
  event_count: number;
}

type SortField = 'page_count' | 'avg_duration' | 'last_seen';
type SortDirection = 'asc' | 'desc';

export default function VisitorList({ siteId, timeRange, onClose, filterActiveOnly = false }: VisitorListProps) {
  const [visitors, setVisitors] = useState<VisitorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('last_seen');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedIpAddress, setSelectedIpAddress] = useState<string | null>(null);
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);
  const [copiedIpAddress, setCopiedIpAddress] = useState<string | null>(null);
  const [usCanadaOnly, setUsCanadaOnly] = useState(false);
  const [residentialOnly, setResidentialOnly] = useState(false);
  const [engagedOnly, setEngagedOnly] = useState(false);

  useEffect(() => {
    loadVisitors();
  }, [siteId, timeRange]);

  const loadVisitors = async () => {
    setLoading(true);
    const now = new Date();
    const cutoff = new Date(now);

    if (timeRange === '24h') cutoff.setHours(now.getHours() - 24);
    else if (timeRange === '7d') cutoff.setDate(now.getDate() - 7);
    else cutoff.setDate(now.getDate() - 30);

    let query = supabase
      .from('sessions')
      .select('session_id, page_count, duration_seconds, first_seen, last_seen, browser, browser_version, os, os_version, device_vendor, device_model, engine_name, cpu_architecture, country')
      .eq('site_id', siteId)
      .gte('first_seen', cutoff.toISOString());

    if (filterActiveOnly) {
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      query = query.gte('last_seen', fiveMinutesAgo.toISOString());
    }

    const { data: sessions } = await query;

    if (sessions && sessions.length > 0) {
      const sessionIds = sessions.map(s => s.session_id);

      const { data: pageViews } = await supabase
        .from('page_views')
        .select('session_id, ip_address, city, timestamp')
        .eq('site_id', siteId)
        .in('session_id', sessionIds)
        .order('timestamp', { ascending: true });

      const ipMap = new Map<string, string>();
      const cityMap = new Map<string, string>();
      if (pageViews) {
        pageViews.forEach(pv => {
          if (!ipMap.has(pv.session_id) && pv.ip_address) {
            ipMap.set(pv.session_id, pv.ip_address);
          }
          if (!cityMap.has(pv.session_id) && pv.city) {
            cityMap.set(pv.session_id, pv.city);
          }
        });
      }

      const ips = [...new Set(ipMap.values())];
      const geoMap = new Map<string, { country_iso_code: string | null; traits_connection_type: string | null }>();
      if (ips.length > 0) {
        const { data: geoRows } = await supabase
          .from('ip_geo_cache')
          .select('ip_address, country_iso_code, traits_connection_type')
          .in('ip_address', ips);
        geoRows?.forEach(g => geoMap.set(g.ip_address, g));
      }

      const eventCounts = new Map<string, number>();
      const countRows = (rows: { session_id: string }[] | null) =>
        rows?.forEach(r => eventCounts.set(r.session_id, (eventCounts.get(r.session_id) || 0) + 1));
      const [{ data: eventRows }, { data: clickRows }] = await Promise.all([
        supabase.from('events').select('session_id').eq('site_id', siteId).in('session_id', sessionIds),
        supabase.from('link_clicks').select('session_id').eq('site_id', siteId).in('session_id', sessionIds)
      ]);
      countRows(eventRows);
      countRows(clickRows);

      const visitorStats: VisitorStats[] = sessions.map(session => ({
        session_id: session.session_id,
        page_count: session.page_count,
        ip_address: ipMap.get(session.session_id) || null,
        city: cityMap.get(session.session_id) || null,
        avg_duration: session.duration_seconds,
        first_seen: session.first_seen,
        last_seen: session.last_seen,
        browser: session.browser,
        browser_version: session.browser_version,
        os: session.os,
        os_version: session.os_version,
        device_vendor: session.device_vendor,
        device_model: session.device_model,
        engine_name: session.engine_name,
        cpu_architecture: session.cpu_architecture,
        country: session.country,
        country_code: geoMap.get(ipMap.get(session.session_id) || '')?.country_iso_code || null,
        connection_type: geoMap.get(ipMap.get(session.session_id) || '')?.traits_connection_type || null,
        event_count: eventCounts.get(session.session_id) || 0
      }));

      setVisitors(visitorStats);
    }
    setLoading(false);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const isUsCanada = (v: VisitorStats) => {
    const values = [v.country_code, v.country].map(c => c?.trim().toLowerCase());
    return values.some(c => c && ['us', 'ca', 'usa', 'united states', 'canada'].includes(c));
  };

  const filteredVisitors = visitors.filter(v =>
    (!usCanadaOnly || isUsCanada(v)) &&
    (!residentialOnly || v.connection_type === 'Cable/DSL') &&
    (!engagedOnly || v.avg_duration > 0 || v.page_count > 1 || v.event_count > 0)
  );

  const sortedVisitors = [...filteredVisitors].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'last_seen') {
      aVal = new Date(aVal as string).getTime();
      bVal = new Date(bVal as string).getTime();
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const copyToClipboard = async (sessionId: string) => {
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopiedSessionId(sessionId);
      setTimeout(() => setCopiedSessionId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyIpToClipboard = async (ipAddress: string) => {
    try {
      await navigator.clipboard.writeText(ipAddress);
      setCopiedIpAddress(ipAddress);
      setTimeout(() => setCopiedIpAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4 text-slate-400" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="w-4 h-4 text-slate-700" />
      : <ArrowDown className="w-4 h-4 text-slate-700" />;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
        <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {filterActiveOnly ? 'Active Visitors' : 'Unique Visitors'}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {filterActiveOnly
                  ? 'Currently active (last 5 minutes)'
                  : timeRange === '24h' ? 'Last 24 hours' : timeRange === '7d' ? 'Last 7 days' : 'Last 30 days'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-slate-200">
            <span className="text-sm text-slate-600 mr-1">Filters:</span>
            {([
              ['US/Canada Only', usCanadaOnly, setUsCanadaOnly],
              ['Residential', residentialOnly, setResidentialOnly],
              ['Engaged', engagedOnly, setEngagedOnly]
            ] as const).map(([label, active, setActive]) => (
              <button
                key={label}
                onClick={() => setActive(!active)}
                aria-pressed={active}
                className={`text-sm px-3 py-1.5 rounded-full border transition ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="text-center py-12 text-slate-600">Loading visitors...</div>
            ) : visitors.length === 0 ? (
              <div className="text-center py-12 text-slate-600">No visitors found</div>
            ) : sortedVisitors.length === 0 ? (
              <div className="text-center py-12 text-slate-600">No visitors match the selected filters</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        Visitor Info
                      </th>
                      <th
                        className="text-left py-3 px-4 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort('page_count')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Pages Visited</span>
                          <SortIcon field="page_count" />
                        </div>
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">
                        IP Address
                      </th>
                      <th
                        className="text-left py-3 px-4 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort('avg_duration')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Avg. Duration</span>
                          <SortIcon field="avg_duration" />
                        </div>
                      </th>
                      <th
                        className="text-left py-3 px-4 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort('last_seen')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Last Seen</span>
                          <SortIcon field="last_seen" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedVisitors.map((visitor) => (
                      <tr
                        key={visitor.session_id}
                        className="border-b border-slate-100 hover:bg-slate-50 transition"
                      >
                        <td className="py-4 px-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-slate-500">
                                {visitor.session_id.substring(0, 20)}...
                              </span>
                              <button
                                onClick={() => copyToClipboard(visitor.session_id)}
                                className="text-slate-400 hover:text-slate-600 transition"
                                title="Copy full session ID"
                              >
                                {copiedSessionId === visitor.session_id ? (
                                  <Check className="w-3.5 h-3.5 text-green-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                              {visitor.browser && (
                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                  {visitor.browser}
                                  {visitor.browser_version && ` v${visitor.browser_version.split('.')[0]}`}
                                </span>
                              )}
                              {visitor.os && (
                                <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                                  {visitor.os}
                                  {visitor.os_version && ` ${visitor.os_version.split('.')[0]}`}
                                </span>
                              )}
                              {visitor.device_vendor && visitor.device_model && (
                                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                  {visitor.device_vendor} {visitor.device_model}
                                </span>
                              )}
                              {visitor.engine_name && (
                                <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded">
                                  {visitor.engine_name}
                                </span>
                              )}
                              {visitor.cpu_architecture && (
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                  {visitor.cpu_architecture}
                                </span>
                              )}
                              {visitor.country && (
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                                  {visitor.country}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => setSelectedSessionId(visitor.session_id)}
                            className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                          >
                            {visitor.page_count}
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          {visitor.ip_address ? (
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setSelectedIpAddress(visitor.ip_address)}
                                  className="text-blue-600 hover:text-blue-800 font-mono text-sm hover:underline"
                                  title="View geolocation details"
                                >
                                  {visitor.ip_address}
                                </button>
                                <button
                                  onClick={() => copyIpToClipboard(visitor.ip_address!)}
                                  className="text-slate-400 hover:text-slate-600 transition"
                                  title="Copy IP address"
                                >
                                  {copiedIpAddress === visitor.ip_address ? (
                                    <Check className="w-3.5 h-3.5 text-green-600" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                              {visitor.city && (
                                <span className="text-slate-500 text-xs mt-1">
                                  {visitor.city}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-slate-900">
                          {formatDuration(visitor.avg_duration)}
                        </td>
                        <td className="py-4 px-4 text-slate-600 text-sm">
                          {formatDate(visitor.last_seen)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-200">
            <div className="text-sm text-slate-600">
              Total unique visitors: <span className="font-semibold text-slate-900">{sortedVisitors.length}</span>
              {sortedVisitors.length !== visitors.length && <span> of {visitors.length}</span>}
            </div>
          </div>
        </div>
      </div>

      {selectedSessionId && (
        <PageViewDrawer
          siteId={siteId}
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}

      {selectedIpAddress && (
        <IpGeoDrawer
          ipAddress={selectedIpAddress}
          onClose={() => setSelectedIpAddress(null)}
        />
      )}
    </>
  );
}
