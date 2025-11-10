import { useState, useEffect } from 'react';
import { Site, supabase } from '../lib/supabase';
import { Eye, Users, Clock, Globe, Settings } from 'lucide-react';
import StatCard from './StatCard';
import RealtimeVisitors from './RealtimeVisitors';
import TopPages from './TopPages';
import TrafficSources from './TrafficSources';
import BrowserStats from './BrowserStats';
import ManageSiteModal from './ManageSiteModal';
import VisitorList from './VisitorList';
import TopLinks from './TopLinks';

interface AnalyticsProps {
  site: Site;
}

interface Stats {
  totalPageViews: number;
  uniqueVisitors: number;
  avgDuration: number;
  activeNow: number;
}

export default function Analytics({ site }: AnalyticsProps) {
  const [stats, setStats] = useState<Stats>({
    totalPageViews: 0,
    uniqueVisitors: 0,
    avgDuration: 0,
    activeNow: 0
  });
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h');
  const [showManageModal, setShowManageModal] = useState(false);
  const [showVisitorList, setShowVisitorList] = useState(false);
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [site.id, timeRange]);

  const loadStats = async () => {
    const now = new Date();
    const cutoff = new Date(now);

    if (timeRange === '24h') cutoff.setHours(now.getHours() - 24);
    else if (timeRange === '7d') cutoff.setDate(now.getDate() - 7);
    else cutoff.setDate(now.getDate() - 30);

    const { data: pageViews } = await supabase
      .from('page_views')
      .select('id')
      .eq('site_id', site.id)
      .gte('timestamp', cutoff.toISOString());

    const { data: sessions } = await supabase
      .from('sessions')
      .select('duration_seconds')
      .eq('site_id', site.id)
      .gte('first_seen', cutoff.toISOString());

    const activeTime = new Date(now);
    activeTime.setMinutes(now.getMinutes() - 5);

    const { data: activeSessions } = await supabase
      .from('sessions')
      .select('id')
      .eq('site_id', site.id)
      .gte('last_seen', activeTime.toISOString());

    const avgDuration = sessions && sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) / sessions.length)
      : 0;

    setStats({
      totalPageViews: pageViews?.length || 0,
      uniqueVisitors: sessions?.length || 0,
      avgDuration,
      activeNow: activeSessions?.length || 0
    });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{site.name}</h2>
            <p className="text-slate-600">{site.domain}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowManageModal(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
            >
              <Settings className="w-4 h-4" />
              <span>Manage Site</span>
            </button>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '24h' | '7d' | '30d')}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Page Views"
            value={stats.totalPageViews.toLocaleString()}
            icon={Eye}
            color="blue"
          />
          <StatCard
            title="Unique Visitors"
            value={stats.uniqueVisitors.toLocaleString()}
            icon={Users}
            color="green"
            clickable={true}
            onClick={() => {
              setFilterActiveOnly(false);
              setShowVisitorList(true);
            }}
          />
          <StatCard
            title="Avg. Duration"
            value={`${Math.floor(stats.avgDuration / 60)}m ${stats.avgDuration % 60}s`}
            icon={Clock}
            color="purple"
          />
          <StatCard
            title="Active Now"
            value={stats.activeNow.toLocaleString()}
            icon={Globe}
            color="red"
            pulse={stats.activeNow > 0}
            clickable={stats.activeNow > 0}
            onClick={() => {
              if (stats.activeNow > 0) {
                setFilterActiveOnly(true);
                setShowVisitorList(true);
              }
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RealtimeVisitors siteId={site.id} />
          <TopPages siteId={site.id} timeRange={timeRange} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrafficSources siteId={site.id} timeRange={timeRange} />
          <BrowserStats siteId={site.id} timeRange={timeRange} />
        </div>

        <TopLinks siteId={site.id} timeRange={timeRange} />
      </div>

      {showManageModal && (
        <ManageSiteModal
          site={site}
          onClose={() => setShowManageModal(false)}
          onSiteUpdated={loadStats}
        />
      )}

      {showVisitorList && (
        <VisitorList
          siteId={site.id}
          timeRange={timeRange}
          onClose={() => setShowVisitorList(false)}
          filterActiveOnly={filterActiveOnly}
        />
      )}
    </>
  );
}
