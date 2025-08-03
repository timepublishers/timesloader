/*
  # Setup Admin User

  1. Admin Setup
    - Create admin user profile for websol@timepublishers.com
    - Set admin privileges

  2. Notes
    - This migration will only work after the user signs up
    - The email verification should be disabled in Supabase settings
*/

-- Function to set admin status for websol@timepublishers.com
CREATE OR REPLACE FUNCTION set_admin_user()
RETURNS void AS $$
BEGIN
  -- Update existing user if they exist
  UPDATE profiles 
  SET is_admin = true 
  WHERE email = 'websol@timepublishers.com';
  
  -- If no rows were updated, the user hasn't signed up yet
  -- The trigger will handle setting admin status when they do sign up
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function
SELECT set_admin_user();

-- Create a trigger to automatically set admin status for websol@timepublishers.com
CREATE OR REPLACE FUNCTION check_admin_email()
RETURNS trigger AS $$
BEGIN
  IF NEW.email = 'websol@timepublishers.com' THEN
    NEW.is_admin = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for admin email check
DROP TRIGGER IF EXISTS check_admin_email_trigger ON profiles;
CREATE TRIGGER check_admin_email_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION check_admin_email();