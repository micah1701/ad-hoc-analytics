import { useState, useEffect } from 'react';
import { X, Globe, MapPin, Building2, Network, Clock, Copy, Check, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface IpGeoDrawerProps {
  ipAddress: string;
  onClose: () => void;
}

interface IpGeoData {
  ip_address: string;
  continent_code: string | null;
  continent_name: string | null;
  country_iso_code: string | null;
  country_name: string | null;
  country_is_eu: boolean | null;
  registered_country_iso_code: string | null;
  registered_country_name: string | null;
  city_geoname_id: number | null;
  city_name: string | null;
  postal_code: string | null;
  subdivisions: { iso_code: string; name: string }[] | null;
  location_latitude: number | null;
  location_longitude: number | null;
  location_accuracy_radius: number | null;
  location_time_zone: string | null;
  traits_autonomous_system_number: number | null;
  traits_autonomous_system_organization: string | null;
  traits_connection_type: string | null;
  traits_domain: string | null;
  traits_isp: string | null;
  traits_organization: string | null;
  traits_network: string | null;
  traits_is_anycast: boolean | null;
  last_updated: string | null;
  last_lookup: string | null;
  lookup_count: number | null;
}

export default function IpGeoDrawer({ ipAddress, onClose }: IpGeoDrawerProps) {
  const [geoData, setGeoData] = useState<IpGeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadGeoData();
  }, [ipAddress]);

  const loadGeoData = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('ip_geo_cache')
      .select('*')
      .eq('ip_address', ipAddress)
      .single();

    setGeoData(data);
    setLoading(false);
  };

  const copyIp = async () => {
    try {
      await navigator.clipboard.writeText(ipAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getFlagEmoji = (countryCode: string) => {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const buildLocationString = (data: IpGeoData): string => {
    const parts: string[] = [];
    if (data.city_name) parts.push(data.city_name);
    if (data.subdivisions && data.subdivisions.length > 0) {
      parts.push(data.subdivisions[0].name);
    }
    if (data.country_name) parts.push(data.country_name);
    return parts.join(', ');
  };

  const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">{title}</h4>
      </div>
      <div className="bg-slate-50 rounded-lg p-4 space-y-2">
        {children}
      </div>
    </div>
  );

  const DataRow = ({ label, value }: { label: string; value: React.ReactNode }) => {
    if (value === null || value === undefined || value === '') return null;
    return (
      <div className="flex items-start justify-between py-1">
        <span className="text-xs text-slate-500 flex-shrink-0">{label}</span>
        <span className="text-sm text-slate-900 text-right ml-4 font-medium">{value}</span>
      </div>
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-[105]"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full sm:w-[500px] bg-white shadow-2xl z-[110] flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900">IP Geolocation</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-mono text-slate-600">{ipAddress}</span>
              <button
                onClick={copyIp}
                className="text-slate-400 hover:text-slate-600 transition"
                title="Copy IP address"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-slate-600">Loading geo data...</div>
          ) : !geoData ? (
            <div className="text-center py-12">
              <Globe className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">No geolocation data available</p>
              <p className="text-sm text-slate-500 mt-1">
                This IP address has not been cached yet. Data is only available for sites with paid geolocation enabled.
              </p>
            </div>
          ) : (
            <>
              {/* Map */}
              {geoData.location_latitude && geoData.location_longitude && (
                <div className="mb-6 rounded-lg overflow-hidden border border-slate-200">
                  <iframe
                    title="IP Location Map"
                    width="100%"
                    height="220"
                    style={{ border: 0 }}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${geoData.location_latitude},${geoData.location_longitude}&zoom=10`}
                  />
                  <div className="bg-slate-50 px-4 py-2 text-xs text-slate-500">
                    <span className="font-mono">{geoData.location_latitude.toFixed(4)}, {geoData.location_longitude.toFixed(4)}</span>
                    {geoData.location_accuracy_radius && (
                      <span className="ml-2">({geoData.location_accuracy_radius} km accuracy)</span>
                    )}
                  </div>
                </div>
              )}

              {/* Location summary card */}
              {(geoData.city_name || geoData.country_name) && (
                <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    {geoData.country_iso_code && (
                      <span className="text-3xl">{getFlagEmoji(geoData.country_iso_code)}</span>
                    )}
                    <div>
                      <div className="text-lg font-semibold text-slate-900">
                        {buildLocationString(geoData)}
                      </div>
                      {geoData.postal_code && (
                        <div className="text-sm text-slate-600">Postal code: {geoData.postal_code}</div>
                      )}
                      {geoData.location_time_zone && (
                        <div className="text-sm text-slate-600">Timezone: {geoData.location_time_zone}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Geographic Details */}
              <Section title="Geography" icon={<MapPin className="w-4 h-4 text-blue-600" />}>
                <DataRow label="Continent" value={geoData.continent_name && `${geoData.continent_name} (${geoData.continent_code})`} />
                <DataRow label="Country" value={geoData.country_name && `${geoData.country_name} (${geoData.country_iso_code})`} />
                <DataRow label="EU Member" value={geoData.country_is_eu !== null ? (geoData.country_is_eu ? 'Yes' : 'No') : null} />
                {geoData.subdivisions && geoData.subdivisions.length > 0 && (
                  <DataRow
                    label={geoData.subdivisions.length > 1 ? 'Subdivisions' : 'State / Region'}
                    value={geoData.subdivisions.map(s => `${s.name} (${s.iso_code})`).join(', ')}
                  />
                )}
                <DataRow label="City" value={geoData.city_name} />
                <DataRow label="Postal Code" value={geoData.postal_code} />
                {geoData.registered_country_name && geoData.registered_country_name !== geoData.country_name && (
                  <DataRow label="Registered Country" value={`${geoData.registered_country_name} (${geoData.registered_country_iso_code})`} />
                )}
              </Section>

              {/* Network Information */}
              {(geoData.traits_isp || geoData.traits_organization || geoData.traits_network || geoData.traits_autonomous_system_number) && (
                <Section title="Network" icon={<Network className="w-4 h-4 text-purple-600" />}>
                  <DataRow label="ISP" value={geoData.traits_isp} />
                  <DataRow label="Organization" value={geoData.traits_organization} />
                  <DataRow label="Domain" value={geoData.traits_domain} />
                  <DataRow label="Network" value={geoData.traits_network} />
                  <DataRow label="Connection Type" value={geoData.traits_connection_type} />
                  <DataRow label="ASN" value={geoData.traits_autonomous_system_number && `AS${geoData.traits_autonomous_system_number}`} />
                  <DataRow label="AS Organization" value={geoData.traits_autonomous_system_organization} />
                  <DataRow label="Anycast" value={geoData.traits_is_anycast !== null ? (geoData.traits_is_anycast ? 'Yes' : 'No') : null} />
                </Section>
              )}

              {/* Cache Info */}
              <Section title="Cache Info" icon={<Clock className="w-4 h-4 text-slate-500" />}>
                <DataRow label="First Cached" value={geoData.last_updated && formatDate(geoData.last_updated)} />
                <DataRow label="Last Lookup" value={geoData.last_lookup && formatDate(geoData.last_lookup)} />
                <DataRow label="Total Lookups" value={geoData.lookup_count} />
              </Section>
            </>
          )}
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
