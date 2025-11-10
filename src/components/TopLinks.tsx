import { useState, useEffect } from 'react';
import { ExternalLink, Download, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TopLinksProps {
  siteId: string;
  timeRange: '24h' | '7d' | '30d';
}

interface LinkStat {
  link_url: string;
  link_type: 'outbound' | 'file_download';
  clicks: number;
  unique_sessions: number;
}

export default function TopLinks({ siteId, timeRange }: TopLinksProps) {
  const [links, setLinks] = useState<LinkStat[]>([]);

  useEffect(() => {
    loadLinks();
  }, [siteId, timeRange]);

  const loadLinks = async () => {
    const now = new Date();
    const cutoff = new Date(now);

    if (timeRange === '24h') cutoff.setHours(now.getHours() - 24);
    else if (timeRange === '7d') cutoff.setDate(now.getDate() - 7);
    else cutoff.setDate(now.getDate() - 30);

    const { data: linkClicks } = await supabase
      .from('link_clicks')
      .select('link_url, link_type, session_id')
      .eq('site_id', siteId)
      .gte('timestamp', cutoff.toISOString());

    if (linkClicks) {
      const linkMap = new Map<string, { type: 'outbound' | 'file_download', clicks: number, sessions: Set<string> }>();

      linkClicks.forEach(click => {
        const existing = linkMap.get(click.link_url);
        if (existing) {
          existing.clicks += 1;
          existing.sessions.add(click.session_id);
        } else {
          linkMap.set(click.link_url, {
            type: click.link_type,
            clicks: 1,
            sessions: new Set([click.session_id])
          });
        }
      });

      const linkStats = Array.from(linkMap.entries())
        .map(([url, data]) => ({
          link_url: url,
          link_type: data.type,
          clicks: data.clicks,
          unique_sessions: data.sessions.size
        }))
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10);

      setLinks(linkStats);
    }
  };

  const truncateUrl = (url: string, maxLength: number = 50) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  const LinkTypeIcon = ({ type }: { type: 'outbound' | 'file_download' }) => {
    if (type === 'file_download') {
      return <Download className="w-4 h-4 text-violet-600" />;
    }
    return <ExternalLink className="w-4 h-4 text-blue-600" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <LinkIcon className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">Top Links</h3>
        </div>
        <p className="text-sm text-slate-500 mt-1">Outbound links and downloads</p>
      </div>

      <div className="divide-y divide-slate-100">
        {links.length === 0 ? (
          <div className="p-6 text-center text-slate-500">No link clicks tracked yet</div>
        ) : (
          links.map((link, index) => (
            <div key={index} className="p-4 hover:bg-slate-50 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <LinkTypeIcon type={link.link_type} />
                    <span className="text-xs font-medium text-slate-600 uppercase">
                      {link.link_type === 'file_download' ? 'Download' : 'Outbound'}
                    </span>
                  </div>
                  <a
                    href={link.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-slate-900 hover:text-blue-600 truncate block"
                    title={link.link_url}
                  >
                    {truncateUrl(link.link_url, 60)}
                  </a>
                  <div className="flex items-center space-x-3 mt-2 text-xs text-slate-500">
                    <span>{link.clicks} clicks</span>
                    <span>•</span>
                    <span>{link.unique_sessions} unique visitors</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">{link.clicks}</div>
                    <div className="text-xs text-slate-500">clicks</div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
