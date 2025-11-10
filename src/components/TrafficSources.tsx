import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ExternalLink } from 'lucide-react';

interface TrafficSourcesProps {
  siteId: string;
  timeRange: '24h' | '7d' | '30d';
}

interface Source {
  source: string;
  visits: number;
  percentage: number;
}

export default function TrafficSources({ siteId, timeRange }: TrafficSourcesProps) {
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    loadSources();
  }, [siteId, timeRange]);

  const loadSources = async () => {
    const now = new Date();
    const cutoff = new Date(now);

    if (timeRange === '24h') cutoff.setHours(now.getHours() - 24);
    else if (timeRange === '7d') cutoff.setDate(now.getDate() - 7);
    else cutoff.setDate(now.getDate() - 30);

    const { data } = await supabase
      .from('sessions')
      .select('referrer')
      .eq('site_id', siteId)
      .gte('first_seen', cutoff.toISOString());

    if (data) {
      const counts: Record<string, number> = {};

      data.forEach(session => {
        let source = 'Direct';
        if (session.referrer) {
          try {
            const url = new URL(session.referrer);
            source = url.hostname.replace('www.', '');
          } catch {
            source = session.referrer;
          }
        }
        counts[source] = (counts[source] || 0) + 1;
      });

      const total = data.length;
      const sorted = Object.entries(counts)
        .map(([source, visits]) => ({
          source,
          visits,
          percentage: Math.round((visits / total) * 100)
        }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 8);

      setSources(sorted);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <ExternalLink className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">Traffic Sources</h3>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {sources.length === 0 ? (
            <div className="text-center text-slate-500">
              No traffic data available
            </div>
          ) : (
            sources.map((source, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-900">
                    {source.source}
                  </span>
                  <span className="text-sm text-slate-600">
                    {source.visits.toLocaleString()} visits
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-slate-900 h-full rounded-full transition-all duration-500"
                      style={{ width: `${source.percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0 w-10 text-right">
                    {source.percentage}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
