import { useState, useEffect } from 'react';
import { X, ExternalLink, Clock, Download, MousePointerClick } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface PageViewDrawerProps {
  siteId: string;
  sessionId: string;
  onClose: () => void;
}

interface PageView {
  id: string;
  page_url: string;
  page_title: string | null;
  timestamp: string;
  referrer: string | null;
}

interface LinkClick {
  id: string;
  page_url: string;
  link_url: string;
  link_text: string | null;
  link_type: 'outbound' | 'file_download';
  timestamp: string;
}

type TimelineEvent =
  | { type: 'page_view'; data: PageView }
  | { type: 'link_click'; data: LinkClick };

export default function PageViewDrawer({ siteId, sessionId, onClose }: PageViewDrawerProps) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimeline();
  }, [siteId, sessionId]);

  const loadTimeline = async () => {
    setLoading(true);

    const [pageViewsResult, linkClicksResult] = await Promise.all([
      supabase
        .from('page_views')
        .select('id, page_url, page_title, timestamp, referrer')
        .eq('site_id', siteId)
        .eq('session_id', sessionId),
      supabase
        .from('link_clicks')
        .select('id, page_url, link_url, link_text, link_type, timestamp')
        .eq('site_id', siteId)
        .eq('session_id', sessionId)
    ]);

    const events: TimelineEvent[] = [];

    if (pageViewsResult.data) {
      pageViewsResult.data.forEach(pv => {
        events.push({ type: 'page_view', data: pv });
      });
    }

    if (linkClicksResult.data) {
      linkClicksResult.data.forEach(lc => {
        events.push({ type: 'link_click', data: lc });
      });
    }

    events.sort((a, b) => {
      const timeA = new Date(a.type === 'page_view' ? a.data.timestamp : a.data.timestamp).getTime();
      const timeB = new Date(b.type === 'page_view' ? b.data.timestamp : b.data.timestamp).getTime();
      return timeA - timeB;
    });

    setTimeline(events);
    setLoading(false);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatFullDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getTimeDifference = (current: string, previous?: string) => {
    if (!previous) return null;
    const diff = Math.floor((new Date(current).getTime() - new Date(previous).getTime()) / 1000);
    if (diff < 60) return `${diff}s later`;
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes}m ${seconds}s later`;
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-[105]"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white shadow-2xl z-[110] flex flex-col animate-slide-in">
      <div className="flex items-center justify-between p-6 border-b border-slate-200">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Page Views</h3>
          <p className="text-sm text-slate-600 mt-1">Session timeline</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center py-12 text-slate-600">Loading timeline...</div>
        ) : timeline.length === 0 ? (
          <div className="text-center py-12 text-slate-600">No activity found</div>
        ) : (
          <div className="space-y-4">
            {timeline.map((event, index) => {
              const prevTimestamp = index > 0
                ? timeline[index - 1].type === 'page_view'
                  ? timeline[index - 1].data.timestamp
                  : timeline[index - 1].data.timestamp
                : undefined;

              const currentTimestamp = event.type === 'page_view'
                ? event.data.timestamp
                : event.data.timestamp;

              if (event.type === 'page_view') {
                const view = event.data;
                const isFirst = index === 0 || timeline.slice(0, index).filter(e => e.type === 'page_view').length === 0;
                const isLast = timeline.slice(index + 1).filter(e => e.type === 'page_view').length === 0;

                return (
                  <div
                    key={`pv-${view.id}`}
                    className="relative pl-8 pb-6 border-l-2 border-slate-200 last:border-l-0 last:pb-0"
                  >
                    <div className="absolute left-[-9px] top-0 w-4 h-4 bg-slate-900 rounded-full border-2 border-white" />

                    {prevTimestamp && (
                      <div className="absolute left-[-32px] top-[-20px] text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                        {getTimeDifference(currentTimestamp, prevTimestamp)}
                      </div>
                    )}

                    <div className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-slate-900 truncate">
                            {view.page_title || 'Untitled Page'}
                          </h4>
                          <a
                            href={view.page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1 mt-1 truncate"
                          >
                            <span className="truncate">{view.page_url}</span>
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-slate-600 mt-3">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(view.timestamp)}</span>
                        </div>
                        {isFirst && view.referrer && (
                          <div className="flex items-center space-x-1">
                            <ExternalLink className="w-3 h-3" />
                            <span className="truncate">from {new URL(view.referrer).hostname}</span>
                          </div>
                        )}
                      </div>

                      {isFirst && (
                        <div className="mt-2 text-xs text-slate-500 bg-white px-2 py-1 rounded inline-block">
                          Entry page
                        </div>
                      )}
                      {isLast && timeline.filter(e => e.type === 'page_view').length > 1 && (
                        <div className="mt-2 text-xs text-slate-500 bg-white px-2 py-1 rounded inline-block">
                          Exit page
                        </div>
                      )}
                    </div>
                  </div>
                );
              } else {
                const click = event.data;
                return (
                  <div
                    key={`lc-${click.id}`}
                    className="relative pl-8 pb-6 border-l-2 border-slate-200 last:border-l-0 last:pb-0"
                  >
                    <div className="absolute left-[-9px] top-0 w-4 h-4 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center">
                      <MousePointerClick className="w-2 h-2 text-white" />
                    </div>

                    {prevTimestamp && (
                      <div className="absolute left-[-32px] top-[-20px] text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                        {getTimeDifference(currentTimestamp, prevTimestamp)}
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 hover:bg-blue-100 transition">
                      <div className="flex items-start space-x-2 mb-2">
                        {click.link_type === 'file_download' ? (
                          <Download className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                        ) : (
                          <ExternalLink className="w-4 h-4 text-blue-700 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-blue-900 uppercase mb-1">
                            {click.link_type === 'file_download' ? 'Downloaded' : 'Clicked link'}
                          </div>
                          {click.link_text && (
                            <div className="text-sm text-slate-700 mb-1 truncate">
                              "{click.link_text}"
                            </div>
                          )}
                          <a
                            href={click.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 hover:underline truncate block"
                            title={click.link_url}
                          >
                            {click.link_url}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-slate-600 mt-2">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(click.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>

      <div className="p-6 border-t border-slate-200 bg-slate-50">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Pages viewed:</span>
            <span className="font-semibold text-slate-900">
              {timeline.filter(e => e.type === 'page_view').length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Links clicked:</span>
            <span className="font-semibold text-slate-900">
              {timeline.filter(e => e.type === 'link_click').length}
            </span>
          </div>
          {timeline.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Session started:</span>
                <span className="font-medium text-slate-900">
                  {formatFullDate(
                    timeline[0].type === 'page_view'
                      ? timeline[0].data.timestamp
                      : timeline[0].data.timestamp
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Last activity:</span>
                <span className="font-medium text-slate-900">
                  {formatFullDate(
                    timeline[timeline.length - 1].type === 'page_view'
                      ? timeline[timeline.length - 1].data.timestamp
                      : timeline[timeline.length - 1].data.timestamp
                  )}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
      </div>
    </>
  );
}
