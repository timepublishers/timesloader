/*
  # Fix User Management and Signup Issues

  1. Database Schema Fixes
    - Fix profiles table structure
    - Add proper triggers for user creation
    - Fix RLS policies
    - Add proper constraints

  2. User Management
    - Enhanced user profiles with all required fields
    - Proper admin user setup
    - Better error handling
*/

-- Drop existing policies and triggers to recreate them properly
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS check_admin_email();

-- Recreate profiles table with proper structure
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  company text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN NEW.email = 'websol@timepublishers.com' THEN true ELSE false END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check admin email
CREATE OR REPLACE FUNCTION check_admin_email()
RETURNS trigger AS $$
BEGIN
  IF NEW.email = 'websol@timepublishers.com' THEN
    NEW.is_admin = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create trigger to automatically set admin status
CREATE TRIGGER check_admin_email_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION check_admin_email();

-- Create trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Insert admin user if not exists (for websol@timepublishers.com)
INSERT INTO profiles (id, email, full_name, is_admin)
SELECT 
  gen_random_uuid(),
  'websol@timepublishers.com',
  'Time Publishers Admin',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM profiles WHERE email = 'websol@timepublishers.com'
);

-- Add some sample data for hosting packages
INSERT INTO hosting_packages (name, description, price, storage, bandwidth, email_accounts, databases, features) VALUES
('Basic Plan', 'Perfect for small websites and blogs', 2500, '5 GB SSD', '50 GB', 5, 2, ARRAY['Free SSL Certificate', 'cPanel Control Panel', '24/7 Support', 'Daily Backups', 'One-Click WordPress Install']),
('Professional Plan', 'Ideal for business websites', 5000, '25 GB SSD', '250 GB', 25, 10, ARRAY['Free SSL Certificate', 'cPanel Control Panel', '24/7 Priority Support', 'Daily Backups', 'One-Click WordPress Install', 'Free Domain for 1 Year', 'Advanced Security']),
('Enterprise Plan', 'For high-traffic websites', 10000, '100 GB SSD', 'Unlimited', -1, -1, ARRAY['Free SSL Certificate', 'cPanel Control Panel', '24/7 VIP Support', 'Daily Backups', 'One-Click WordPress Install', 'Free Domain for 1 Year', 'Advanced Security', 'CDN Integration', 'Dedicated IP'])
ON CONFLICT (name) DO NOTHING;

-- Add domain pricing
INSERT INTO domain_pricing (extension, price) VALUES
('.com', 6250),
('.pk', 3750)
ON CONFLICT (extension) DO NOTHING;

-- Add default services
INSERT INTO services (title, description, icon, features, price_starting, display_order) VALUES
('Domain Registration', 'Secure your perfect domain name with competitive pricing for .com and .pk domains.', 'Globe', ARRAY['Instant activation', 'Free DNS management', 'Domain privacy protection', 'Easy domain transfer', '24/7 support'], 3750, 1),
('Web Hosting', 'Reliable and fast web hosting solutions with 99.9% uptime guarantee.', 'Server', ARRAY['SSD storage', 'Free SSL certificates', '24/7 technical support', 'cPanel control panel', 'Daily backups'], 2500, 2),
('Website Development', 'Professional website development services tailored to your business needs.', 'Code', ARRAY['Custom design', 'Responsive layout', 'SEO optimization', 'Content management', 'Mobile-friendly'], 15000, 3),
('Technical Support', 'Round-the-clock technical support for all your hosting and domain needs.', 'Smartphone', ARRAY['24/7 availability', 'Expert technicians', 'Remote assistance', 'Quick response time', 'Multiple support channels'], NULL, 4)
ON CONFLICT (title) DO NOTHING;