import { Globe, ChevronRight } from 'lucide-react';
import { Site } from '../lib/supabase';

interface SiteListProps {
  sites: Site[];
  selectedSite: Site | null;
  onSelectSite: (site: Site) => void;
  onRefresh: () => void;
}

export default function SiteList({ sites, selectedSite, onSelectSite }: SiteListProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Your Sites</h2>
      </div>
      <div className="divide-y divide-slate-100">
        {sites.map((site) => (
          <button
            key={site.id}
            onClick={() => onSelectSite(site)}
            className={`w-full p-4 text-left hover:bg-slate-50 transition flex items-center justify-between ${
              selectedSite?.id === site.id ? 'bg-slate-50' : ''
            }`}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className={`p-2 rounded-lg ${
                selectedSite?.id === site.id ? 'bg-slate-900' : 'bg-slate-100'
              }`}>
                <Globe className={`w-4 h-4 ${
                  selectedSite?.id === site.id ? 'text-white' : 'text-slate-600'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-900 truncate">{site.name}</div>
                <div className="text-sm text-slate-500 truncate">{site.domain}</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
