import { useState, useEffect } from 'react';
import { X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PageViewDrawer from './PageViewDrawer';

interface VisitorListProps {
  siteId: string;
  timeRange: '24h' | '7d' | '30d';
  onClose: () => void;
  filterActiveOnly?: boolean;
}

interface VisitorStats {
  session_id: string;
  page_count: number;
  total_sessions: number;
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
}

type SortField = 'page_count' | 'total_sessions' | 'avg_duration' | 'last_seen';
type SortDirection = 'asc' | 'desc';

export default function VisitorList({ siteId, timeRange, onClose, filterActiveOnly = false }: VisitorListProps) {
  const [visitors, setVisitors] = useState<VisitorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('last_seen');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

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

    if (sessions) {
      const visitorMap = new Map<string, VisitorStats>();

      sessions.forEach(session => {
        const existing = visitorMap.get(session.session_id);

        if (existing) {
          existing.total_sessions += 1;
          existing.page_count += session.page_count;
          existing.avg_duration = Math.round(
            (existing.avg_duration * (existing.total_sessions - 1) + session.duration_seconds) /
            existing.total_sessions
          );
          if (new Date(session.last_seen) > new Date(existing.last_seen)) {
            existing.last_seen = session.last_seen;
          }
        } else {
          visitorMap.set(session.session_id, {
            session_id: session.session_id,
            page_count: session.page_count,
            total_sessions: 1,
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
            country: session.country
          });
        }
      });

      setVisitors(Array.from(visitorMap.values()));
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

  const sortedVisitors = [...visitors].sort((a, b) => {
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

          <div className="flex-1 overflow-auto p-6">
            {loading ? (
              <div className="text-center py-12 text-slate-600">Loading visitors...</div>
            ) : visitors.length === 0 ? (
              <div className="text-center py-12 text-slate-600">No visitors found</div>
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
                      <th
                        className="text-left py-3 px-4 text-sm font-semibold text-slate-700 cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort('total_sessions')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Sessions</span>
                          <SortIcon field="total_sessions" />
                        </div>
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
                            <span className="text-xs font-mono text-slate-500">
                              {visitor.session_id.substring(0, 20)}...
                            </span>
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
                        <td className="py-4 px-4 text-slate-900">
                          {visitor.total_sessions}
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
              Total unique visitors: <span className="font-semibold text-slate-900">{visitors.length}</span>
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
    </>
  );
}
