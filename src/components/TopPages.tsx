import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText } from 'lucide-react';

interface TopPagesProps {
  siteId: string;
  timeRange: '24h' | '7d' | '30d';
}

interface PageStat {
  page_url: string;
  views: number;
  percentage: number;
}

export default function TopPages({ siteId, timeRange }: TopPagesProps) {
  const [pages, setPages] = useState<PageStat[]>([]);

  useEffect(() => {
    loadTopPages();
  }, [siteId, timeRange]);

  const loadTopPages = async () => {
    const now = new Date();
    const cutoff = new Date(now);

    if (timeRange === '24h') cutoff.setHours(now.getHours() - 24);
    else if (timeRange === '7d') cutoff.setDate(now.getDate() - 7);
    else cutoff.setDate(now.getDate() - 30);

    const { data } = await supabase
      .from('page_views')
      .select('page_url')
      .eq('site_id', siteId)
      .gte('timestamp', cutoff.toISOString());

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach(view => {
        counts[view.page_url] = (counts[view.page_url] || 0) + 1;
      });

      const total = data.length;
      const sorted = Object.entries(counts)
        .map(([page_url, views]) => ({
          page_url,
          views,
          percentage: Math.round((views / total) * 100)
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      setPages(sorted);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">Top Pages</h3>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {pages.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            No page data available
          </div>
        ) : (
          pages.map((page, index) => (
            <div key={index} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-900 truncate flex-1">
                  {page.page_url}
                </p>
                <span className="text-sm text-slate-600 ml-4 flex-shrink-0">
                  {page.views.toLocaleString()} views
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-slate-900 h-full rounded-full transition-all duration-500"
                    style={{ width: `${page.percentage}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500 flex-shrink-0">
                  {page.percentage}%
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
