import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Activity } from 'lucide-react';
import  StringToColor from '../utils/StringToColor'
import PageViewDrawer from './PageViewDrawer';

interface RealtimeVisitorsProps {
  siteId: string;
}

interface RecentView {
  session_id: string;
  page_url: string;
  page_title: string | null;
  timestamp: string;
  exit_timestamp: string | null;
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
      .select('session_id, page_url, page_title, timestamp, exit_timestamp')
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
                  <p className="text-xs text-slate-500 truncate mt-2">
                    Session ID: <span style={{ color: StringToColor(view.session_id) }}>{view.session_id.split('_').pop()?.toUpperCase()}</span>
                  </p>                  
                </div>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 mr-1 mt-1 ${view.exit_timestamp ? 'bg-red-500' : 'bg-green-500'}`} title={view.exit_timestamp ? 'Inactive' : 'Active'}></span>
                <span className="text-xs text-slate-400 ml-1 flex-shrink-0">
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