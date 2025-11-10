import { useState, useEffect } from 'react';
import { X, Code, Settings, AlertTriangle, Copy, Check, Save, Loader2, Trash2 } from 'lucide-react';
import { Site, updateSite, getAnalyticsCounts, deleteSiteAnalytics, AnalyticsCounts } from '../lib/supabase';

interface ManageSiteModalProps {
  site: Site;
  onClose: () => void;
  onSiteUpdated: () => void;
}

type TabType = 'install' | 'settings' | 'danger';

export default function ManageSiteModal({ site, onClose, onSiteUpdated }: ManageSiteModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('install');
  const [copied, setCopied] = useState(false);
  const [siteName, setSiteName] = useState(site.name);
  const [siteDomain, setSiteDomain] = useState(site.domain);
  const [siteActive, setSiteActive] = useState(site.active);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [analyticsCounts, setAnalyticsCounts] = useState<AnalyticsCounts | null>(null);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteUnderstood, setDeleteUnderstood] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const appUrl = window.location.origin;

  const installCode = `<!-- Analytics Tracking Code -->
<script>
  window.ANALYTICS_CONFIG = {
    trackingId: '${site.tracking_id}',
    apiUrl: '${supabaseUrl}/functions/v1/track'
  };
</script>
<script src="${appUrl}/analytics.js" defer></script>`;

  useEffect(() => {
    if (activeTab === 'danger') {
      loadAnalyticsCounts();
    }
  }, [activeTab]);

  const loadAnalyticsCounts = async () => {
    setLoadingCounts(true);
    const counts = await getAnalyticsCounts(site.id);
    setAnalyticsCounts(counts);
    setLoadingCounts(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(installCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = async () => {
    if (!siteName.trim() || !siteDomain.trim()) {
      setSaveError('Site name and domain are required');
      return;
    }

    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    const { error } = await updateSite(site.id, {
      name: siteName.trim(),
      domain: siteDomain.trim(),
      active: siteActive
    });

    setSaving(false);

    if (error) {
      setSaveError(error.message || 'Failed to update site');
    } else {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onSiteUpdated();
    }
  };

  const handleDeleteAnalytics = async () => {
    if (deleteConfirmation !== site.name || !deleteUnderstood) {
      return;
    }

    setDeleting(true);
    setDeleteError('');
    setDeleteSuccess(false);

    const result = await deleteSiteAnalytics(site.id);

    setDeleting(false);

    if (result.success) {
      setDeleteSuccess(true);
      setDeleteConfirmation('');
      setDeleteUnderstood(false);
      await loadAnalyticsCounts();
      onSiteUpdated();
    } else {
      setDeleteError(result.error || 'Failed to delete analytics data');
    }
  };

  const tabs = [
    { id: 'install' as TabType, label: 'Install Code', icon: Code },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings },
    { id: 'danger' as TabType, label: 'Danger Zone', icon: AlertTriangle }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Manage Site</h2>
            <p className="text-sm text-slate-600 mt-1">{site.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-b border-slate-200 flex-shrink-0">
          <div className="flex space-x-1 p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  } ${tab.id === 'danger' ? 'ml-auto' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'install' && (
            <div className="space-y-4">
              <p className="text-slate-600">
                Copy and paste this code into the <code className="bg-slate-100 px-2 py-1 rounded text-sm">{'<head>'}</code> section of your website, just before the closing <code className="bg-slate-100 px-2 py-1 rounded text-sm">{'</head>'}</code> tag.
              </p>

              <div className="relative">
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{installCode}</code>
                </pre>
                <button
                  onClick={handleCopy}
                  className="absolute top-3 right-3 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>

              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Tracking ID</h3>
                  <code className="text-sm text-blue-700 break-all">{site.tracking_id}</code>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-900 mb-2">Important URLs</h3>
                  <div className="text-sm text-amber-800 space-y-2">
                    <div>
                      <span className="font-medium">Script URL:</span>
                      <div className="font-mono text-xs mt-1 break-all">{appUrl}/analytics.js</div>
                    </div>
                    <div>
                      <span className="font-medium">API Endpoint:</span>
                      <div className="font-mono text-xs mt-1 break-all">{supabaseUrl}/functions/v1/track</div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-2">What gets tracked automatically?</h3>
                  <ul className="text-sm text-slate-600 space-y-1 list-disc list-inside">
                    <li>Page views and navigation</li>
                    <li>Session duration and behavior</li>
                    <li>Outbound link clicks</li>
                    <li>File downloads (PDF, DOC, ZIP, etc.)</li>
                    <li>Browser, OS, and device type</li>
                    <li>Screen resolution and language</li>
                    <li>Referrer information</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Manual tracking (optional)</h3>
                  <p className="text-sm text-blue-800 mb-2">
                    For JavaScript-triggered downloads or outbound links:
                  </p>
                  <pre className="bg-blue-900 text-blue-100 p-3 rounded text-xs overflow-x-auto">
{`// Track a download
window.analytics.trackDownload(
  'https://example.com/file.pdf',
  'Report Name'
);

// Track an outbound link
window.analytics.trackOutboundLink(
  'https://example.com',
  'Link Text'
);`}
                  </pre>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <h3 className="font-semibold text-emerald-900 mb-2">Custom event tracking</h3>
                  <p className="text-sm text-emerald-800 mb-2">
                    Track custom user interactions and behaviors:
                  </p>
                  <pre className="bg-emerald-900 text-emerald-100 p-3 rounded text-xs overflow-x-auto">
{`// Track button clicks
window.analytics.trackEvent('button_click', {
  button_name: 'Sign Up',
  location: 'hero_section'
});

// Track form submissions
window.analytics.trackEvent('form_submit', {
  form_name: 'contact_form',
  fields_completed: 5
});

// Track video interactions
window.analytics.trackEvent('video_play', {
  video_title: 'Product Demo',
  duration: '2:30'
});

// Track e-commerce actions
window.analytics.trackEvent('add_to_cart', {
  product_id: 'ABC123',
  product_name: 'Premium Widget',
  price: 29.99
});

// Track search queries
window.analytics.trackEvent('search', {
  query: 'analytics dashboard',
  results_count: 42
});`}
                  </pre>
                  <div className="mt-3 text-xs text-emerald-800 space-y-1">
                    <p><strong>Best Practices:</strong></p>
                    <ul className="list-disc list-inside space-y-0.5 ml-2">
                      <li>Use lowercase with underscores for event names</li>
                      <li>Include relevant context in event data</li>
                      <li>Events are stored in the events table with session info</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  placeholder="My Awesome Site"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Domain
                </label>
                <input
                  type="text"
                  value={siteDomain}
                  onChange={(e) => setSiteDomain(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  placeholder="example.com"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-slate-900">Active Tracking</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Enable or disable analytics tracking for this site
                  </p>
                </div>
                <button
                  onClick={() => setSiteActive(!siteActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    siteActive ? 'bg-slate-900' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      siteActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {saveSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm font-medium">
                    Settings saved successfully!
                  </p>
                </div>
              )}

              {saveError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm font-medium">{saveError}</p>
                </div>
              )}

              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="space-y-6">
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">Danger Zone</h3>
                    <p className="text-sm text-red-800">
                      This action will permanently delete all analytics data for this site. This includes all page views, sessions, events, and link clicks. This action cannot be undone.
                    </p>
                    <p className="text-sm text-red-800 mt-2 font-medium">
                      Note: Your site configuration will NOT be deleted. You can continue collecting new analytics data after deletion.
                    </p>
                  </div>
                </div>
              </div>

              {loadingCounts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : analyticsCounts && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h3 className="font-semibold text-slate-900 mb-3">Data to be deleted:</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Page Views:</span>
                      <span className="font-medium text-slate-900">{analyticsCounts.page_views.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Sessions:</span>
                      <span className="font-medium text-slate-900">{analyticsCounts.sessions.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Link Clicks:</span>
                      <span className="font-medium text-slate-900">{analyticsCounts.link_clicks.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Events:</span>
                      <span className="font-medium text-slate-900">{analyticsCounts.events.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between col-span-2 pt-2 border-t border-slate-300">
                      <span className="text-slate-900 font-semibold">Total Records:</span>
                      <span className="font-bold text-slate-900">{analyticsCounts.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deleteUnderstood}
                    onChange={(e) => setDeleteUnderstood(e.target.checked)}
                    className="mt-1 w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                  />
                  <span className="text-sm text-slate-700">
                    I understand that this action is permanent and cannot be undone
                  </span>
                </label>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Type <span className="font-bold">{site.name}</span> to confirm deletion
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                    placeholder={site.name}
                    disabled={!deleteUnderstood}
                  />
                </div>
              </div>

              {deleteSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 text-sm font-medium">
                    All analytics data has been successfully deleted!
                  </p>
                </div>
              )}

              {deleteError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm font-medium">{deleteError}</p>
                </div>
              )}

              <button
                onClick={handleDeleteAnalytics}
                disabled={!deleteUnderstood || deleteConfirmation !== site.name || deleting}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete All Analytics Data</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
