import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Activity } from 'lucide-react';
import PageViewDrawer from './PageViewDrawer';

interface RealtimeVisitorsProps {
  siteId: string;
}

interface RecentView {
  session_id: string;
  page_url: string;
  page_title: string | null;
  timestamp: string;
  country: string | null;
  browser: string | null;
}

export default function RealtimeVisitors({ siteId }: RealtimeVisitorsProps) {
  const [recentViews, setRecentViews] = useState<RecentView[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadRecentViews();
    const interval = setInterval(loadRecentViews, 5000);
    return () => clearInterval(interval);
  }, [siteId]);

  const loadRecentViews = async () => {
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const { data } = await supabase
      .from('page_views')
      .select('session_id, page_url, page_title, timestamp')
      .eq('site_id', siteId)
      .gte('timestamp', fiveMinutesAgo.toISOString())
      .order('timestamp', { ascending: false })
      .limit(10);

    if (data) {
      setRecentViews(data);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">Real-time Activity</h3>
        </div>
        <p className="text-sm text-slate-500 mt-1">Last 5 minutes</p>
      </div>
      <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
        {recentViews.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            No recent activity
          </div>
        ) : (
          recentViews.map((view, index) => (
            <div
              key={index}
              className="p-4 hover:bg-slate-50 transition cursor-pointer"
              onClick={() => setSelectedSessionId(view.session_id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {view.page_title || 'Untitled Page'}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-1">
                    {view.page_url}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    {view.country && (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {view.country}
                      </span>
                    )}
                    {view.browser && (
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {view.browser}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-slate-400 ml-4 flex-shrink-0">
                  {getTimeAgo(view.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedSessionId && (
        <PageViewDrawer
          siteId={siteId}
          sessionId={selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
        />
      )}
    </div>
  );
}
