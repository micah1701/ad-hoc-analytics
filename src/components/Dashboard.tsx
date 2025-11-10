import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Site } from '../lib/supabase';
import { Menu, BarChart3 } from 'lucide-react';
import Analytics from './Analytics';
import AddSiteModal from './AddSiteModal';
import MenuDrawer from './MenuDrawer';

export default function Dashboard() {
  const { signOut } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setSites(data);
      if (data.length > 0 && !selectedSite) {
        setSelectedSite(data[0]);
      }
    }
    setLoading(false);
  };

  const handleAddSite = async (name: string, domain: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('sites')
      .insert({ user_id: user.id, name, domain });

    if (!error) {
      await loadSites();
      setShowAddModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-slate-900 rounded-lg p-2">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900">Ad-Hoc Analytics</h1>
            </div>

            <button
              onClick={() => setIsMenuOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
              <span className="hidden sm:inline">Menu</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sites.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <BarChart3 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              No sites yet
            </h2>
            <p className="text-slate-600 mb-6">
              Add your first site to start tracking analytics
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
            >
              <Plus className="w-5 h-5" />
              <span>Add Your First Site</span>
            </button>
          </div>
        ) : (
          <div>
            {selectedSite && <Analytics site={selectedSite} />}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddSiteModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddSite}
        />
      )}

      <MenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        sites={sites}
        selectedSite={selectedSite}
        onSelectSite={setSelectedSite}
        onAddSite={() => setShowAddModal(true)}
        onSignOut={signOut}
        onRefreshSites={loadSites}
      />
    </div>
  );
}
