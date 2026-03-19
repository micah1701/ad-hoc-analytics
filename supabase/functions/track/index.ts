import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { UAParser } from 'npm:ua-parser-js@2.0.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey'
};

function flattenMaxMindResponse(data) {
  const subdivisions = (data.subdivisions || []).map((s) => ({
    iso_code: s.iso_code || null,
    name: s.names?.en || null
  }));
  return {
    continent_code: data.continent?.code || null,
    continent_name: data.continent?.names?.en || null,
    country_iso_code: data.country?.iso_code || null,
    country_name: data.country?.names?.en || null,
    country_is_eu: data.country?.is_in_european_union || false,
    registered_country_iso_code: data.registered_country?.iso_code || null,
    registered_country_name: data.registered_country?.names?.en || null,
    city_geoname_id: data.city?.geoname_id || null,
    city_name: data.city?.names?.en || null,
    postal_code: data.postal?.code || null,
    subdivisions: subdivisions.length > 0 ? subdivisions : null,
    location_latitude: data.location?.latitude || null,
    location_longitude: data.location?.longitude || null,
    location_accuracy_radius: data.location?.accuracy_radius || null,
    location_time_zone: data.location?.time_zone || null,
    traits_autonomous_system_number: data.traits?.autonomous_system_number || null,
    traits_autonomous_system_organization: data.traits?.autonomous_system_organization || null,
    traits_connection_type: data.traits?.connection_type || null,
    traits_domain: data.traits?.domain || null,
    traits_isp: data.traits?.isp || null,
    traits_organization: data.traits?.organization || null,
    traits_network: data.traits?.network || null,
    traits_is_anycast: data.traits?.is_anycast || false
  };
}

async function callMaxMind(ip, usePaidGeo) {
  const accountId = Deno.env.get('MAXMIND_ACCOUNT_ID');
  const licenseKey = Deno.env.get('MAXMIND_LICENSE_KEY');
  if (!accountId || !licenseKey) {
    console.error('MaxMind credentials not configured');
    return null;
  }
  const baseUrl = usePaidGeo
    ? 'https://geoip.maxmind.com/geoip/v2.1/city'
    : 'https://geolite.info/geoip/v2.1/city';
  const response = await fetch(`${baseUrl}/${ip}`, {
    headers: {
      'Authorization': 'Basic ' + btoa(`${accountId}:${licenseKey}`),
      'Accept': 'application/json'
    }
  });
  if (!response.ok) {
    console.error(`MaxMind API error: ${response.status} for IP ${ip}`);
    return null;
  }
  return await response.json();
}

function formatCity(flattened) {
  if (!flattened.city_name) return null;
  const state = flattened.subdivisions?.[0]?.iso_code || null;
  return state ? `${flattened.city_name}, ${state}` : flattened.city_name;
}

async function lookupGeo(ip, usePaidGeo, supabase) {
  if (!ip) return { country: null, city: null };
  try {
    if (usePaidGeo) {
      // Check cache first
      const { data: cached, error: selectErr } = await supabase
        .from('ip_geo_cache')
        .select('*')
        .eq('ip_address', ip)
        .maybeSingle();
      if (selectErr) console.error('ip_geo_cache select error:', selectErr);
      if (cached) {
        // Cache hit — update tracking columns
        const { error: updateErr } = await supabase
          .from('ip_geo_cache')
          .update({
            last_lookup: new Date().toISOString(),
            lookup_count: (cached.lookup_count || 0) + 1
          })
          .eq('ip_address', ip);
        if (updateErr) console.error('ip_geo_cache update error:', updateErr);
        const cachedState = cached.subdivisions?.[0]?.iso_code || null;
        const cachedCity = cached.city_name
          ? (cachedState ? `${cached.city_name}, ${cachedState}` : cached.city_name)
          : null;
        return {
          country: cached.country_iso_code || null,
          city: cachedCity
        };
      }
      // Cache miss — call paid endpoint
      const rawData = await callMaxMind(ip, true);
      if (!rawData) return { country: null, city: null };
      const flattened = flattenMaxMindResponse(rawData);
      // Insert into cache
      const { error: insertErr } = await supabase
        .from('ip_geo_cache')
        .insert({
          ip_address: ip,
          ...flattened,
          last_updated: new Date().toISOString(),
          last_lookup: null,
          lookup_count: 0
        });
      if (insertErr) console.error('ip_geo_cache insert error:', insertErr);
      return {
        country: flattened.country_iso_code || null,
        city: formatCity(flattened)
      };
    }
    // Free GeoLite — no caching
    const rawData = await callMaxMind(ip, false);
    if (!rawData) return { country: null, city: null };
    const flattened = flattenMaxMindResponse(rawData);
    return {
      country: flattened.country_iso_code || null,
      city: formatCity(flattened)
    };
  } catch (err) {
    console.error('Geo lookup error:', err);
    return { country: null, city: null };
  }
}

function isIpInCidr(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split('/');
  const mask = bits ? ~(2 ** (32 - parseInt(bits)) - 1) : 0xffffffff;

  const ipNum = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
  const rangeNum = range.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;

  return (ipNum & mask) === (rangeNum & mask);
}
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
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('default_supabase_secret_key') ?? '', { 
      db: { schema: 'adhoc_analytics' }
    });
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
    const { data: site } = await supabase.from('sites').select('id, active, use_uaparser, excluded_ips, use_paid_geo').eq('tracking_id', tracking_id).eq('active', true).maybeSingle();
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
    const geo = await lookupGeo(ip, site.use_paid_geo ?? false, supabase);
    
    if (ip && site.excluded_ips && Array.isArray(site.excluded_ips) && site.excluded_ips.length > 0) {
      const isExcluded = site.excluded_ips.some((excludedIp: string) => {
        if (excludedIp.includes('/')) {
          return isIpInCidr(ip, excludedIp);
        } else {
          return ip === excludedIp;
        }
      });

      if (isExcluded) {
        return new Response(JSON.stringify({
          success: true,
          excluded: true
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    if (event_name) {
      await supabase.from('events').insert({
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

      await supabase.from('link_clicks').insert({
        site_id: site.id,
        session_id,
        page_url: page_url || '',
        link_url,
        link_text: link_text || null,
        link_type,
        timestamp: new Date().toISOString(),
        country: geo.country
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
    const { data: existingSession } = await supabase.from('sessions').select('id, first_seen, page_count, entry_page').eq('session_id', session_id).maybeSingle();
    if (existingSession) {
      const duration = Math.floor((Date.now() - new Date(existingSession.first_seen).getTime()) / 1000);
      const pageCountIncrement = (is_unload && is_unload === true) ? 0 : 1;
      await supabase.from('sessions').update({
        last_seen: new Date().toISOString(),
        page_count: existingSession.page_count + pageCountIncrement,
        duration_seconds: duration,
        exit_page: page_url
      }).eq('session_id', session_id);
    } else {
      await supabase.from('sessions').insert({
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
        cpu_architecture,
        country: geo.country,
        city: geo.city
      });
    }
    if (is_unload && is_unload === true) {
      const { data: existingPageView } = await supabase.from('page_views').select('id').eq('session_id', session_id).eq('page_url', page_url).order('timestamp', {
        ascending: false
      }).limit(1).maybeSingle();
      if (existingPageView) {
        await supabase.from('page_views').update({
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
    await supabase.from('page_views').insert({
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
      country: geo.country,
      city: geo.city
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
