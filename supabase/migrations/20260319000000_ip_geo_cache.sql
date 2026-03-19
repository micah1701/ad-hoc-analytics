/*
  # IP Geolocation Cache + Paid GeoIP Support

  ## Overview
  Adds support for MaxMind's paid GeoIP City Plus endpoint with IP-based caching
  to avoid redundant lookups.

  ## Changes
  1. Adds `use_paid_geo` boolean to `sites` table (default false)
     - false = use free GeoLite endpoint
     - true = use paid GeoIP City Plus endpoint with caching

  2. Creates `ip_geo_cache` table
     - Stores flattened MaxMind response data (codes, iso_codes, English names only)
     - Primary key on ip_address for fast lookups
     - Tracks last_updated (when fetched from MaxMind), last_lookup (cache hits),
       and lookup_count (number of cache hits)
*/

-- =====================================================
-- ALTER SITES TABLE
-- =====================================================

ALTER TABLE adhoc_analytics.sites ADD COLUMN IF NOT EXISTS use_paid_geo boolean DEFAULT false;

-- =====================================================
-- IP GEO CACHE TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS adhoc_analytics.ip_geo_cache (
  ip_address inet PRIMARY KEY,

  -- Continent
  continent_code text,
  continent_name text,

  -- Country
  country_iso_code text,
  country_name text,
  country_is_eu boolean,

  -- Registered Country
  registered_country_iso_code text,
  registered_country_name text,

  -- City
  city_geoname_id integer,
  city_name text,

  -- Postal
  postal_code text,

  -- Subdivisions (array of {iso_code, name})
  subdivisions jsonb,

  -- Location
  location_latitude double precision,
  location_longitude double precision,
  location_accuracy_radius integer,
  location_time_zone text,

  -- Traits
  traits_autonomous_system_number integer,
  traits_autonomous_system_organization text,
  traits_connection_type text,
  traits_domain text,
  traits_isp text,
  traits_organization text,
  traits_network text,
  traits_is_anycast boolean,

  -- Cache tracking
  last_updated timestamptz DEFAULT now(),
  last_lookup timestamptz,
  lookup_count integer DEFAULT 0
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ip_geo_cache_country ON adhoc_analytics.ip_geo_cache(country_iso_code);
CREATE INDEX IF NOT EXISTS idx_ip_geo_cache_last_updated ON adhoc_analytics.ip_geo_cache(last_updated);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE adhoc_analytics.ip_geo_cache ENABLE ROW LEVEL SECURITY;

-- Service role can insert and update (used by edge function)
CREATE POLICY "Service role can insert ip_geo_cache"
  ON adhoc_analytics.ip_geo_cache FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can update ip_geo_cache"
  ON adhoc_analytics.ip_geo_cache FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can select ip_geo_cache"
  ON adhoc_analytics.ip_geo_cache FOR SELECT
  TO authenticated
  USING (true);
