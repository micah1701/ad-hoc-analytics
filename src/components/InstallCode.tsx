import { useState } from 'react';
import { X, Copy, Check } from 'lucide-react';

interface InstallCodeProps {
  trackingId: string;
  onClose: () => void;
}

export default function InstallCode({ trackingId, onClose }: InstallCodeProps) {
  const [copied, setCopied] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const appUrl = window.location.origin;

  const installCode = `<!-- Analytics Tracking Code -->
<script>
  window.ANALYTICS_CONFIG = {
    trackingId: '${trackingId}',
    apiUrl: '${supabaseUrl}/functions/v1/track'
  };
</script>
<script src="${appUrl}/analytics.js" defer></script>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(installCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-900">Install Tracking Code</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-slate-600 mb-4">
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

          <div className="mt-6 space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Tracking ID</h3>
              <code className="text-sm text-blue-700 break-all">{trackingId}</code>
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
                For JavaScript-triggered downloads or custom events:
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
          </div>

        </div>

        <div className="p-6 border-t border-slate-200 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
