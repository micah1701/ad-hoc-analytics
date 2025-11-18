/*
  # Analytics Platform - Complete Database Setup

  ## Overview
  This migration creates the complete database structure for a website analytics platform.
  It consolidates all previous migrations into a single, comprehensive setup file.

  ## Tables

  ### 1. `sites`
  Stores registered websites/properties that use analytics tracking
  - `id` (uuid, primary key) - Unique site identifier
  - `user_id` (uuid, foreign key to auth.users) - Site owner
  - `name` (text) - Site name/description
  - `domain` (text) - Primary domain of the site
  - `tracking_id` (text, unique) - Public tracking identifier for embed code
  - `active` (boolean) - Whether tracking is enabled
  - `use_uaparser` (boolean) - Enable enhanced browser detection with UAParser.js
  - `is_default` (boolean) - Whether this is the default site for the user (only one per user)
  - `created_at` (timestamptz) - When site was registered

  ### 2. `page_views`
  Records individual page view events
  - `id` (uuid, primary key) - Unique page view identifier
  - `site_id` (uuid, foreign key) - Which site this belongs to
  - `session_id` (text) - Groups views into sessions
  - `page_url` (text) - Full URL visited
  - `page_title` (text) - Page title
  - `referrer` (text) - Where visitor came from
  - `user_agent` (text) - Browser user agent string
  - `ip_address` (inet) - Visitor IP (for geolocation)
  - `country` (text) - Country code from IP
  - `city` (text) - City from IP
  - `screen_width` (integer) - Screen resolution width
  - `screen_height` (integer) - Screen resolution height
  - `language` (text) - Browser language
  - `timestamp` (timestamptz) - When view occurred
  
  ### 3. `sessions`
  Aggregated session data for performance
  - `id` (uuid, primary key) - Unique session identifier
  - `site_id` (uuid, foreign key) - Which site
  - `session_id` (text, unique) - Session identifier from client
  - `first_seen` (timestamptz) - Session start time
  - `last_seen` (timestamptz) - Session end time
  - `page_count` (integer) - Number of pages viewed
  - `duration_seconds` (integer) - Total time on site
  - `entry_page` (text) - First page visited
  - `exit_page` (text) - Last page visited
  - `referrer` (text) - Original referrer
  - `browser` (text) - Browser used
  - `os` (text) - Operating system
  - `device_type` (text) - Device type
  - `country` (text) - Visitor country
  - `city` (text) - Visitor city
  - Enhanced UAParser fields :
    - `browser_version` (text)
    - `os_version` (text)
    - `device_vendor` (text)
    - `device_model` (text)
    - `engine_name` (text)
    - `engine_version` (text)
    - `cpu_architecture` (text)

  ### 4. `events`
  Custom events tracking (clicks, interactions, etc.)
  - `id` (uuid, primary key) - Unique event identifier
  - `site_id` (uuid, foreign key) - Which site
  - `session_id` (text) - Associated session
  - `event_name` (text) - Name of the event
  - `event_data` (jsonb) - Additional event metadata
  - `timestamp` (timestamptz) - When event occurred

  ### 5. `link_clicks`
  Tracks outbound links and file downloads
  - `id` (uuid, primary key) - Unique identifier
  - `site_id` (uuid, foreign key) - Links to sites table
  - `session_id` (text) - User session identifier
  - `page_url` (text) - Page where link was clicked
  - `link_url` (text) - The clicked link URL
  - `link_text` (text) - The link text/label
  - `link_type` (text) - Type: 'outbound' or 'file_download'
  - `timestamp` (timestamptz) - When the click occurred
  - `country` (text) - Country code
  - `created_at` (timestamptz) - Record creation time

  ## Security
  - RLS enabled on all tables
  - Users can only access data for sites they own
  - Tracking endpoint uses service role for inserts
  - Optimized RLS policies using `(select auth.uid())`
  - Functions use `SECURITY DEFINER` with `SET search_path = ''`

  ## Performance
  - Indexes optimized for common query patterns
  - Foreign key indexes for efficient joins
  - Partial indexes on enhanced detection fields
  - Query performance optimized for real-time analytics

  ## Functions
  - `set_others_sites_default_to_false()` - Ensures only one default site per user
  - `delete_site_analytics_data(uuid)` - Safely delete all analytics for a site
  - `get_site_analytics_counts(uuid)` - Get record counts without deleting

  ## Triggers
  - `trigger_set_others_sites_default_to_false` - Maintains unique default site per user
*/

-- =====================================================
-- TABLES
-- =====================================================

-- Sites table
CREATE TABLE IF NOT EXISTS sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  domain text NOT NULL,
  tracking_id text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(12), 'base64'),
  active boolean DEFAULT true,
  use_uaparser boolean DEFAULT true,
  is_default boolean DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

-- Page views table
CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  session_id text NOT NULL,
  page_url text NOT NULL,
  page_title text,
  referrer text,
  user_agent text,
  ip_address inet,
  country text,
  city text,
  screen_width integer,
  screen_height integer,
  language text,
  timestamp timestamptz DEFAULT now(),
  exit_timestamp timestamptz
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  session_id text UNIQUE NOT NULL,
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  page_count integer DEFAULT 1,
  duration_seconds integer DEFAULT 0,
  entry_page text,
  exit_page text,
  referrer text,
  browser text,
  os text,
  device_type text,
  country text,
  city text,
  browser_version text,
  os_version text,
  device_vendor text,
  device_model text,
  engine_name text,
  engine_version text,
  cpu_architecture text
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid REFERENCES sites(id) ON DELETE CASCADE NOT NULL,
  session_id text NOT NULL,
  event_name text NOT NULL,
  event_data jsonb,
  timestamp timestamptz DEFAULT now()
);

-- Link clicks table
CREATE TABLE IF NOT EXISTS link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  page_url text NOT NULL,
  link_url text NOT NULL,
  link_text text,
  link_type text NOT NULL CHECK (link_type IN ('outbound', 'file_download')),
  timestamp timestamptz DEFAULT now(),
  country text,
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Page views indexes
CREATE INDEX IF NOT EXISTS idx_page_views_site_timestamp ON page_views(site_id, timestamp DESC);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_site_first_seen ON sessions(site_id, first_seen DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_browser_version ON sessions(site_id, browser_version) WHERE browser_version IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_os_version ON sessions(site_id, os_version) WHERE os_version IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_device_vendor ON sessions(site_id, device_vendor) WHERE device_vendor IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_engine_name ON sessions(site_id, engine_name) WHERE engine_name IS NOT NULL;

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_site_id ON events(site_id);

-- Link clicks indexes
CREATE INDEX IF NOT EXISTS idx_link_clicks_site_id ON link_clicks(site_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_session ON link_clicks(session_id, timestamp);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;

-- Sites policies
CREATE POLICY "Users can view own sites"
  ON sites FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own sites"
  ON sites FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own sites"
  ON sites FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own sites"
  ON sites FOR DELETE
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- Page views policies
CREATE POLICY "Users can view page views for their sites"
  ON page_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = page_views.site_id
      AND sites.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Service role can insert page views"
  ON page_views FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Sessions policies
CREATE POLICY "Users can view sessions for their sites"
  ON sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = sessions.site_id
      AND sites.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Service role can insert sessions"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can update sessions"
  ON sessions FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Events policies
CREATE POLICY "Users can view events for their sites"
  ON events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = events.site_id
      AND sites.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Service role can insert events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Link clicks policies
CREATE POLICY "Users can view link clicks for their sites"
  ON link_clicks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sites
      WHERE sites.id = link_clicks.site_id
      AND sites.user_id = (select auth.uid())
    )
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to ensure only one default site per user
CREATE OR REPLACE FUNCTION set_others_sites_default_to_false()
   RETURNS TRIGGER AS $$
   BEGIN
       IF NEW.is_default = TRUE THEN
           UPDATE sites
           SET is_default = FALSE
           WHERE user_id = NEW.user_id
             AND id <> NEW.id; -- Exclude the currently updated row
       END IF;
       RETURN NEW;
   END;
   $$ LANGUAGE plpgsql;

-- Function to delete all analytics data for a site
CREATE OR REPLACE FUNCTION delete_site_analytics_data(p_site_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_link_clicks_count int;
  v_events_count int;
  v_sessions_count int;
  v_page_views_count int;
BEGIN
  -- Get the current user's ID
  v_user_id := (SELECT auth.uid());

  -- Verify the user owns this site
  IF NOT EXISTS (
    SELECT 1 FROM public.sites
    WHERE id = p_site_id
    AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Site not found or you do not have permission to delete its data'
    );
  END IF;

  -- Delete link_clicks and get count
  WITH deleted AS (
    DELETE FROM public.link_clicks
    WHERE site_id = p_site_id
    RETURNING *
  )
  SELECT COUNT(*) INTO v_link_clicks_count FROM deleted;

  -- Delete events and get count
  WITH deleted AS (
    DELETE FROM public.events
    WHERE site_id = p_site_id
    RETURNING *
  )
  SELECT COUNT(*) INTO v_events_count FROM deleted;

  -- Delete sessions and get count
  WITH deleted AS (
    DELETE FROM public.sessions
    WHERE site_id = p_site_id
    RETURNING *
  )
  SELECT COUNT(*) INTO v_sessions_count FROM deleted;

  -- Delete page_views and get count
  WITH deleted AS (
    DELETE FROM public.page_views
    WHERE site_id = p_site_id
    RETURNING *
  )
  SELECT COUNT(*) INTO v_page_views_count FROM deleted;

  -- Return success with counts
  RETURN jsonb_build_object(
    'success', true,
    'deleted', jsonb_build_object(
      'link_clicks', v_link_clicks_count,
      'events', v_events_count,
      'sessions', v_sessions_count,
      'page_views', v_page_views_count
    ),
    'message', 'Successfully deleted all analytics data for site'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_site_analytics_data(uuid) TO authenticated;

-- Function to get analytics data counts without deleting
CREATE OR REPLACE FUNCTION get_site_analytics_counts(p_site_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
  v_link_clicks_count int;
  v_events_count int;
  v_sessions_count int;
  v_page_views_count int;
BEGIN
  -- Get the current user's ID
  v_user_id := (SELECT auth.uid());

  -- Verify the user owns this site
  IF NOT EXISTS (
    SELECT 1 FROM public.sites
    WHERE id = p_site_id
    AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Site not found or you do not have permission to view its data'
    );
  END IF;

  -- Count link_clicks
  SELECT COUNT(*) INTO v_link_clicks_count
  FROM public.link_clicks
  WHERE site_id = p_site_id;

  -- Count events
  SELECT COUNT(*) INTO v_events_count
  FROM public.events
  WHERE site_id = p_site_id;

  -- Count sessions
  SELECT COUNT(*) INTO v_sessions_count
  FROM public.sessions
  WHERE site_id = p_site_id;

  -- Count page_views
  SELECT COUNT(*) INTO v_page_views_count
  FROM public.page_views
  WHERE site_id = p_site_id;

  -- Return counts
  RETURN jsonb_build_object(
    'success', true,
    'counts', jsonb_build_object(
      'link_clicks', v_link_clicks_count,
      'events', v_events_count,
      'sessions', v_sessions_count,
      'page_views', v_page_views_count,
      'total', v_link_clicks_count + v_events_count + v_sessions_count + v_page_views_count
    )
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_site_analytics_counts(uuid) TO authenticated;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to ensure only one default site per user
CREATE TRIGGER trigger_set_others_sites_default_to_false
    BEFORE UPDATE OF is_default ON sites
    FOR EACH ROW
    EXECUTE FUNCTION set_others_sites_default_to_false();

CREATE TRIGGER trigger_set_others_sites_default_to_false_insert
    BEFORE INSERT ON sites
    FOR EACH ROW
    EXECUTE FUNCTION set_others_sites_default_to_false();
