/*
  # Add IP Exclusion Feature to Sites

  1. Changes
    - Add `excluded_ips` column to `sites` table
      - Type: text array (text[])
      - Nullable: true (optional field)
      - Default: empty array
      - Description: List of IP addresses or IP ranges (CIDR notation) to exclude from tracking
  
  2. Notes
    - Supports both individual IPs (e.g., "192.168.1.1") and CIDR ranges (e.g., "192.168.1.0/24")
    - Empty array by default means no IPs are excluded
    - Column is added safely with IF NOT EXISTS check
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'sites' 
    AND column_name = 'excluded_ips'
  ) THEN
    ALTER TABLE public.sites 
    ADD COLUMN excluded_ips text[] DEFAULT '{}';
  END IF;
END $$;