/*
  # Complete Time Publishers Database Schema

  1. New Tables
    - `services` - Manageable services list
    - Enhanced user tracking tables
    - Admin management tables
  
  2. Security
    - Enhanced RLS policies
    - Admin-only access controls
    - User data protection
  
  3. Functions
    - Admin email checking
    - Automatic profile creation
    - Updated timestamp triggers
*/

-- Create services table for admin-manageable services
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'Server',
  features text[] DEFAULT '{}',
  price_starting integer,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enhanced user domains table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_domains' AND column_name = 'dns_settings'
  ) THEN
    ALTER TABLE user_domains ADD COLUMN dns_settings jsonb DEFAULT '{}';
    ALTER TABLE user_domains ADD COLUMN whois_privacy boolean DEFAULT false;
    ALTER TABLE user_domains ADD COLUMN transfer_lock boolean DEFAULT true;
  END IF;
END $$;

-- Enhanced user hosting table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_hosting' AND column_name = 'cpanel_username'
  ) THEN
    ALTER TABLE user_hosting ADD COLUMN cpanel_username text;
    ALTER TABLE user_hosting ADD COLUMN ftp_details jsonb DEFAULT '{}';
    ALTER TABLE user_hosting ADD COLUMN ssl_status text DEFAULT 'active';
    ALTER TABLE user_hosting ADD COLUMN backup_frequency text DEFAULT 'daily';
  END IF;
END $$;

-- Insert default services
INSERT INTO services (title, description, icon, features, price_starting, display_order) VALUES
('Domain Registration', 'Secure your perfect domain name with competitive pricing for .com and .pk domains.', 'Globe', ARRAY['Instant activation', 'Free DNS management', 'Domain privacy protection', 'Transfer assistance', 'WHOIS privacy'], 3750, 1),
('Web Hosting', 'Reliable and fast web hosting solutions with 99.9% uptime guarantee.', 'Server', ARRAY['SSD storage', 'Free SSL certificates', '24/7 technical support', 'cPanel control panel', 'Daily backups', 'One-click installs'], 2500, 2),
('Website Development', 'Custom website development tailored to your business needs.', 'Code', ARRAY['Responsive design', 'Content management', 'E-commerce solutions', 'SEO optimization', 'Mobile optimization', 'Maintenance support'], 25000, 3),
('Mobile App Development', 'Native and cross-platform mobile app development services.', 'Smartphone', ARRAY['iOS and Android', 'Cross-platform solutions', 'UI/UX design', 'App store optimization', 'Push notifications', 'Maintenance'], 150000, 4)
ON CONFLICT DO NOTHING;

-- Enhanced RLS policies for services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active services"
  ON services
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage services"
  ON services
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Update triggers for services
CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enhanced admin policies for all tables
CREATE POLICY "Admins can manage all hosting packages"
  ON hosting_packages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can manage all domain pricing"
  ON domain_pricing
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );

-- Update contact inquiries policies
CREATE POLICY "Admins can manage contact inquiries"
  ON contact_inquiries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );