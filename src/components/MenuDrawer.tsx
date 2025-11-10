import { useEffect } from 'react';
import { X, LogOut, Plus, User } from 'lucide-react';
import { Site } from '../lib/supabase';
import SiteList from './SiteList';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sites: Site[];
  selectedSite: Site | null;
  onSelectSite: (site: Site) => void;
  onAddSite: () => void;
  onSignOut: () => void;
  onRefreshSites: () => void;
}

export default function MenuDrawer({
  isOpen,
  onClose,
  sites,
  selectedSite,
  onSelectSite,
  onAddSite,
  onSignOut,
  onRefreshSites,
}: MenuDrawerProps) {
  const handleSelectSite = (site: Site) => {
    onSelectSite(site);
    onClose();
  };

  const handleAddSite = () => {
    onAddSite();
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }

    return () => {
      document.body.classList.remove('menu-open');
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 h-full bg-white shadow-2xl z-50 w-full sm:w-96 lg:w-[400px] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
              aria-label="Close menu"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                    Your Sites
                  </h3>
                  <button
                    onClick={handleAddSite}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-slate-900 text-white text-sm rounded-lg hover:bg-slate-800 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Site</span>
                  </button>
                </div>

                {sites.length > 0 ? (
                  <SiteList
                    sites={sites}
                    selectedSite={selectedSite}
                    onSelectSite={handleSelectSite}
                    onRefresh={onRefreshSites}
                  />
                ) : (
                  <div className="text-center py-8 px-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-600">No sites yet</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Add your first site to get started
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
                  Account
                </h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-slate-50 rounded-lg transition text-slate-600">
                    <User className="w-5 h-5" />
                    <span className="text-sm font-medium">Account Settings</span>
                    <span className="ml-auto text-xs text-slate-400">Coming Soon</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 p-6">
            <button
              onClick={onSignOut}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
