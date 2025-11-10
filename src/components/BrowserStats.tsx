import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Monitor, ChevronDown, ChevronUp } from 'lucide-react';

interface BrowserStatsProps {
  siteId: string;
  timeRange: '24h' | '7d' | '30d';
}

interface TechData {
  name: string;
  count: number;
  percentage: number;
}

interface SessionData {
  browser: string | null;
  browser_version: string | null;
  os: string | null;
  os_version: string | null;
  device_type: string | null;
  device_vendor: string | null;
  device_model: string | null;
  engine_name: string | null;
  engine_version: string | null;
  cpu_architecture: string | null;
}

export default function BrowserStats({ siteId, timeRange }: BrowserStatsProps) {
  const [browsers, setBrowsers] = useState<TechData[]>([]);
  const [operatingSystems, setOperatingSystems] = useState<TechData[]>([]);
  const [devices, setDevices] = useState<TechData[]>([]);
  const [engines, setEngines] = useState<TechData[]>([]);
  const [architectures, setArchitectures] = useState<TechData[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    browsers: true,
    os: false,
    devices: true,
    engines: false,
    cpu: false,
  });

  useEffect(() => {
    loadStats();
  }, [siteId, timeRange]);

  const loadStats = async () => {
    const now = new Date();
    const cutoff = new Date(now);

    if (timeRange === '24h') cutoff.setHours(now.getHours() - 24);
    else if (timeRange === '7d') cutoff.setDate(now.getDate() - 7);
    else cutoff.setDate(now.getDate() - 30);

    const { data } = await supabase
      .from('sessions')
      .select('browser, browser_version, os, os_version, device_type, device_vendor, device_model, engine_name, engine_version, cpu_architecture')
      .eq('site_id', siteId)
      .gte('first_seen', cutoff.toISOString());

    if (data) {
      processBrowserData(data);
      processOSData(data);
      processDeviceData(data);
      processEngineData(data);
      processCPUData(data);
    }
  };

  const processBrowserData = (data: SessionData[]) => {
    const counts: Record<string, number> = {};

    data.forEach(session => {
      if (session.browser) {
        const displayName = session.browser_version
          ? `${session.browser.split(' ')[0]} ${session.browser_version.split('.')[0]}`
          : session.browser;
        counts[displayName] = (counts[displayName] || 0) + 1;
      }
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    setBrowsers(
      Object.entries(counts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
    );
  };

  const processOSData = (data: SessionData[]) => {
    const counts: Record<string, number> = {};

    data.forEach(session => {
      if (session.os) {
        const displayName = session.os_version
          ? `${session.os} ${session.os_version.split('.')[0]}`
          : session.os;
        counts[displayName] = (counts[displayName] || 0) + 1;
      }
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    setOperatingSystems(
      Object.entries(counts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
    );
  };

  const processDeviceData = (data: SessionData[]) => {
    const counts: Record<string, number> = {};

    data.forEach(session => {
      if (session.device_type) {
        let displayName = session.device_type.charAt(0).toUpperCase() + session.device_type.slice(1);

        if (session.device_vendor && session.device_model && session.device_type === 'mobile') {
          displayName = `${session.device_vendor} ${session.device_model}`;
        }

        counts[displayName] = (counts[displayName] || 0) + 1;
      }
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    setDevices(
      Object.entries(counts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
    );
  };

  const processEngineData = (data: SessionData[]) => {
    const counts: Record<string, number> = {};

    data.forEach(session => {
      if (session.engine_name) {
        const displayName = session.engine_version
          ? `${session.engine_name} ${session.engine_version.split('.')[0]}`
          : session.engine_name;
        counts[displayName] = (counts[displayName] || 0) + 1;
      }
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    setEngines(
      Object.entries(counts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    );
  };

  const processCPUData = (data: SessionData[]) => {
    const counts: Record<string, number> = {};

    data.forEach(session => {
      if (session.cpu_architecture) {
        counts[session.cpu_architecture] = (counts[session.cpu_architecture] || 0) + 1;
      }
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    setArchitectures(
      Object.entries(counts)
        .map(([name, count]) => ({
          name,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
    );
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const renderSection = (
    title: string,
    data: TechData[],
    sectionKey: keyof typeof expandedSections,
    emptyMessage: string
  ) => {
    const isExpanded = expandedSections[sectionKey];

    return (
      <div className="border-t border-slate-200 first:border-t-0">
        <button
          onClick={() => toggleSection(sectionKey)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition"
        >
          <h4 className="text-sm font-medium text-slate-700">{title}</h4>
          <div className="flex items-center space-x-2">
            {data.length > 0 && (
              <span className="text-xs text-slate-500">{data.length} types</span>
            )}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 space-y-3">
            {data.length === 0 ? (
              <p className="text-sm text-slate-500">{emptyMessage}</p>
            ) : (
              data.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-900">{item.name}</span>
                    <span className="text-sm text-slate-600">{item.percentage}%</span>
                  </div>
                  <div className="bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-slate-900 h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-2">
          <Monitor className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900">Technology</h3>
        </div>
      </div>
      <div>
        {renderSection('Browsers', browsers, 'browsers', 'No browser data available')}
        {renderSection('Operating Systems', operatingSystems, 'os', 'No OS data available')}
        {renderSection('Devices', devices, 'devices', 'No device data available')}
        {renderSection('Browser Engines', engines, 'engines', 'No engine data available')}
        {renderSection('CPU Architecture', architectures, 'cpu', 'No CPU data available')}
      </div>
    </div>
  );
}
