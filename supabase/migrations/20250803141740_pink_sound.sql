/*
  # Initial Schema Setup for Time Publishers

  1. New Tables
    - `profiles` - User profile information with admin flag
    - `hosting_packages` - Available hosting packages with pricing and features
    - `domain_pricing` - Domain extension pricing
    - `user_domains` - User's registered domains with expiry tracking
    - `user_hosting` - User's hosting services with package details
    - `complaints` - User complaints and support tickets
    - `contact_inquiries` - Contact form submissions

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Admin-only access for management tables
    - Public read access for pricing tables

  3. Sample Data
    - Default hosting packages
    - Domain pricing for .com and .pk
    - Admin user setup
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  phone text,
  company text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create hosting packages table
CREATE TABLE IF NOT EXISTS hosting_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price integer NOT NULL, -- Price in PKR
  storage text NOT NULL,
  bandwidth text NOT NULL,
  email_accounts integer NOT NULL DEFAULT -1, -- -1 means unlimited
  databases integer NOT NULL DEFAULT -1, -- -1 means unlimited
  features text[] NOT NULL DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create domain pricing table
CREATE TABLE IF NOT EXISTS domain_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  extension text UNIQUE NOT NULL,
  price integer NOT NULL, -- Price in PKR per year
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user domains table
CREATE TABLE IF NOT EXISTS user_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  domain_name text NOT NULL,
  extension text NOT NULL,
  price_paid integer NOT NULL,
  registration_date date NOT NULL,
  expiry_date date NOT NULL,
  payment_due_date date NOT NULL,
  status text CHECK (status IN ('active', 'expired', 'pending')) DEFAULT 'active',
  auto_renew boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user hosting table
CREATE TABLE IF NOT EXISTS user_hosting (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  package_id uuid REFERENCES hosting_packages(id) NOT NULL,
  domain_name text NOT NULL,
  price_paid integer NOT NULL,
  start_date date NOT NULL,
  expiry_date date NOT NULL,
  payment_due_date date NOT NULL,
  status text CHECK (status IN ('active', 'suspended', 'expired')) DEFAULT 'active',
  auto_renew boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  category text CHECK (category IN ('domain', 'hosting', 'billing', 'technical', 'other')) NOT NULL,
  status text CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  priority text CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  admin_response text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contact inquiries table
CREATE TABLE IF NOT EXISTS contact_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  subject text NOT NULL,
  message text NOT NULL,
  status text CHECK (status IN ('new', 'contacted', 'resolved')) DEFAULT 'new',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosting_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_hosting ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Hosting packages policies (public read, admin write)
CREATE POLICY "Anyone can read active hosting packages"
  ON hosting_packages FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage hosting packages"
  ON hosting_packages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Domain pricing policies (public read, admin write)
CREATE POLICY "Anyone can read active domain pricing"
  ON domain_pricing FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage domain pricing"
  ON domain_pricing FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- User domains policies
CREATE POLICY "Users can read own domains"
  ON user_domains FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all domains"
  ON user_domains FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- User hosting policies
CREATE POLICY "Users can read own hosting"
  ON user_hosting FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all hosting"
  ON user_hosting FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Complaints policies
CREATE POLICY "Users can read own complaints"
  ON complaints FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create complaints"
  ON complaints FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all complaints"
  ON complaints FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Contact inquiries policies
CREATE POLICY "Anyone can create contact inquiries"
  ON contact_inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read all contact inquiries"
  ON contact_inquiries FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Insert sample hosting packages
INSERT INTO hosting_packages (name, description, price, storage, bandwidth, email_accounts, databases, features) VALUES
('Starter', 'Perfect for small websites and blogs', 2500, '10 GB SSD', '100 GB', 5, 2, ARRAY['Free SSL Certificate', 'Daily Backups', 'cPanel Access', '24/7 Support', 'One-Click WordPress Install']),
('Professional', 'Ideal for business websites and online stores', 5000, '50 GB SSD', '500 GB', 25, 10, ARRAY['Free SSL Certificate', 'Daily Backups', 'cPanel Access', '24/7 Support', 'One-Click WordPress Install', 'Free Domain Transfer', 'Advanced Security']),
('Enterprise', 'For high-traffic websites and applications', 10000, '200 GB SSD', 'Unlimited', -1, -1, ARRAY['Free SSL Certificate', 'Daily Backups', 'cPanel Access', '24/7 Support', 'One-Click WordPress Install', 'Free Domain Transfer', 'Advanced Security', 'Priority Support', 'CDN Integration', 'Staging Environment']);

-- Insert domain pricing
INSERT INTO domain_pricing (extension, price) VALUES
('.com', 6250),
('.pk', 3750);

-- Create function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update profile updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hosting_packages_updated_at BEFORE UPDATE ON hosting_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_domain_pricing_updated_at BEFORE UPDATE ON domain_pricing FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_domains_updated_at BEFORE UPDATE ON user_domains FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_hosting_updated_at BEFORE UPDATE ON user_hosting FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_inquiries_updated_at BEFORE UPDATE ON contact_inquiries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();