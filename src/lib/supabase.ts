import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Site {
  id: string;
  user_id: string;
  name: string;
  domain: string;
  tracking_id: string;
  active: boolean;
  created_at: string;
}

export interface PageView {
  id: string;
  site_id: string;
  session_id: string;
  page_url: string;
  page_title: string | null;
  referrer: string | null;
  user_agent: string | null;
  ip_address: string | null;
  country: string | null;
  city: string | null;
  screen_width: number | null;
  screen_height: number | null;
  language: string | null;
  timestamp: string;
  exit_timestamp: string | null;
}

export interface Session {
  id: string;
  site_id: string;
  session_id: string;
  first_seen: string;
  last_seen: string;
  page_count: number;
  duration_seconds: number;
  entry_page: string | null;
  exit_page: string | null;
  referrer: string | null;
  browser: string | null;
  os: string | null;
  device_type: string | null;
  country: string | null;
  city: string | null;
}

export interface AnalyticsEvent {
  id: string;
  site_id: string;
  session_id: string;
  event_name: string;
  event_data: Record<string, any> | null;
  timestamp: string;
}

export interface AnalyticsCounts {
  link_clicks: number;
  events: number;
  sessions: number;
  page_views: number;
  total: number;
}

export interface DeleteAnalyticsResult {
  success: boolean;
  deleted?: {
    link_clicks: number;
    events: number;
    sessions: number;
    page_views: number;
  };
  message?: string;
  error?: string;
}

export async function updateSite(siteId: string, updates: { name?: string; domain?: string; active?: boolean }) {
  return await supabase
    .from('sites')
    .update(updates)
    .eq('id', siteId)
    .select()
    .single();
}

export async function getAnalyticsCounts(siteId: string): Promise<AnalyticsCounts | null> {
  const { data, error } = await supabase.rpc('get_site_analytics_counts', {
    p_site_id: siteId
  });

  if (error || !data?.success) {
    console.error('Error fetching analytics counts:', error || data?.error);
    return null;
  }

  return data.counts as AnalyticsCounts;
}

export async function deleteSiteAnalytics(siteId: string): Promise<DeleteAnalyticsResult> {
  const { data, error } = await supabase.rpc('delete_site_analytics_data', {
    p_site_id: siteId
  });

  if (error) {
    console.error('Error deleting analytics data:', error);
    return {
      success: false,
      error: error.message
    };
  }

  return data as DeleteAnalyticsResult;
}