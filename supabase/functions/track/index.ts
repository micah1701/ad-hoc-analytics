import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { UAParser } from 'npm:ua-parser-js@2.0.6';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey'
};
function parseUserAgent(ua, useUAParser = true) {
  if (!useUAParser) {
    const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/(\d+)/);
    const os = ua.match(/(Windows|Mac|Linux|Android|iOS)/);
    const isMobile = /Mobile|Android|iPhone/.test(ua);
    return {
      browser: browser ? `${browser[1]} ${browser[2]}` : 'Unknown',
      os: os ? os[1] : 'Unknown',
      device_type: isMobile ? 'mobile' : 'desktop',
      browser_version: null,
      os_version: null,
      device_vendor: null,
      device_model: null,
      engine_name: null,
      engine_version: null,
      cpu_architecture: null
    };
  }
  const parser = new UAParser(ua);
  const result = parser.getResult();
  const browserName = result.browser.name || 'Unknown';
  const browserVersion = result.browser.version || null;
  const browserMajor = result.browser.major || null;
  const osName = result.os.name || 'Unknown';
  const osVersion = result.os.version || null;
  const deviceType = result.device.type || 'desktop';
  const deviceVendor = result.device.vendor || null;
  const deviceModel = result.device.model || null;
  const engineName = result.engine.name || null;
  const engineVersion = result.engine.version || null;
  const cpuArch = result.cpu.architecture || null;
  const browser = browserMajor ? `${browserName} ${browserMajor}` : browserName;
  return {
    browser,
    os: osName,
    device_type: deviceType === 'mobile' || deviceType === 'tablet' ? 'mobile' : 'desktop',
    browser_version: browserVersion,
    os_version: osVersion,
    device_vendor: deviceVendor,
    device_model: deviceModel,
    engine_name: engineName,
    engine_version: engineVersion,
    cpu_architecture: cpuArch
  };
}
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const data = await req.json();
    const { tracking_id, session_id, page_url, page_title, referrer, screen_width, screen_height, language, event_type, link_url, link_text, link_type, event_name, event_data, is_unload } = data;
    if (!tracking_id || !session_id) {
      return new Response(JSON.stringify({
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { data: site } = await supabase.from('adhoc_analytics.sites').select('id, active, use_uaparser').eq('tracking_id', tracking_id).eq('active', true).maybeSingle();
    if (!site) {
      return new Response(JSON.stringify({
        error: 'Invalid tracking ID or inactive site'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const userAgent = req.headers.get('user-agent') || '';
    const parsedUA = parseUserAgent(userAgent, site.use_uaparser ?? true);
    const { browser, os, device_type, browser_version, os_version, device_vendor, device_model, engine_name, engine_version, cpu_architecture } = parsedUA;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || null;
    if (event_name) {
      await supabase.from('adhoc_analytics.events').insert({
        site_id: site.id,
        session_id,
        event_name,
        event_data: event_data || null,
        timestamp: new Date().toISOString()
      });
      return new Response(JSON.stringify({
        success: true
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (event_type === 'link_click') {
      if (!link_url || !link_type) {
        return new Response(JSON.stringify({
          error: 'Missing link click data'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      await supabase.from('adhoc_analytics.link_clicks').insert({
        site_id: site.id,
        session_id,
        page_url: page_url || '',
        link_url,
        link_text: link_text || null,
        link_type,
        timestamp: new Date().toISOString(),
        country: null
      });
      return new Response(JSON.stringify({
        success: true
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (!page_url) {
      return new Response(JSON.stringify({
        error: 'Missing page_url'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { data: existingSession } = await supabase.from('adhoc_analytics.sessions').select('id, first_seen, page_count, entry_page').eq('session_id', session_id).maybeSingle();
    if (existingSession) {
      const duration = Math.floor((Date.now() - new Date(existingSession.first_seen).getTime()) / 1000);
      const pageCountIncrement = (is_unload && is_unload === true) ? 0 : 1;
      await supabase.from('adhoc_analytics.sessions').update({
        last_seen: new Date().toISOString(),
        page_count: existingSession.page_count + pageCountIncrement,
        duration_seconds: duration,
        exit_page: page_url
      }).eq('session_id', session_id);
    } else {
      await supabase.from('adhoc_analytics.sessions').insert({
        site_id: site.id,
        session_id,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString(),
        page_count: 1,
        duration_seconds: 0,
        entry_page: page_url,
        exit_page: page_url,
        referrer: referrer || null,
        browser,
        os,
        device_type,
        browser_version,
        os_version,
        device_vendor,
        device_model,
        engine_name,
        engine_version,
        cpu_architecture
      });
    }
    if (is_unload && is_unload === true) {
      const { data: existingPageView } = await supabase.from('adhoc_analytics.page_views').select('id').eq('session_id', session_id).eq('page_url', page_url).order('timestamp', {
        ascending: false
      }).limit(1).maybeSingle();
      if (existingPageView) {
        await supabase.from('adhoc_analytics.page_views').update({
          exit_timestamp: new Date().toISOString()
        }).eq('id', existingPageView.id);
      }
      return new Response(JSON.stringify({
        success: true
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    await supabase.from('adhoc_analytics.page_views').insert({
      site_id: site.id,
      session_id,
      page_url,
      page_title: page_title || null,
      referrer: referrer || null,
      user_agent: userAgent,
      ip_address: ip,
      screen_width,
      screen_height,
      language,
      timestamp: new Date().toISOString(),
      country: null
    });
    return new Response(JSON.stringify({
      success: true
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error tracking page view:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});