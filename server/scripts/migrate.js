import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createTables = async () => {
  try {
    console.log('🚀 Starting database migration...');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        firebase_uid VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255),
        phone VARCHAR(50),
        company VARCHAR(255),
        is_admin BOOLEAN DEFAULT FALSE,
        email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create services table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        icon VARCHAR(100) DEFAULT 'Server',
        features TEXT[] DEFAULT '{}',
        price_starting INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create hosting_packages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hosting_packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price INTEGER NOT NULL,
        storage VARCHAR(100) NOT NULL,
        bandwidth VARCHAR(100) NOT NULL,
        email_accounts INTEGER DEFAULT -1,
        databases INTEGER DEFAULT -1,
        features TEXT[] DEFAULT '{}',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create domain_pricing table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS domain_pricing (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        extension VARCHAR(50) UNIQUE NOT NULL,
        price INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create user_domains table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_domains (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        domain_name VARCHAR(255) NOT NULL,
        extension VARCHAR(50) NOT NULL,
        price_paid INTEGER NOT NULL,
        registration_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        payment_due_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending')),
        auto_renew BOOLEAN DEFAULT FALSE,
        dns_settings JSONB DEFAULT '{}',
        whois_privacy BOOLEAN DEFAULT FALSE,
        transfer_lock BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create user_hosting table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_hosting (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        package_id UUID NOT NULL REFERENCES hosting_packages(id),
        domain_name VARCHAR(255) NOT NULL,
        price_paid INTEGER NOT NULL,
        start_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        payment_due_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'expired')),
        auto_renew BOOLEAN DEFAULT FALSE,
        cpanel_username VARCHAR(100),
        ftp_details JSONB DEFAULT '{}',
        ssl_status VARCHAR(20) DEFAULT 'active',
        backup_frequency VARCHAR(20) DEFAULT 'daily',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create complaints table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subject VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category VARCHAR(50) NOT NULL CHECK (category IN ('domain', 'hosting', 'billing', 'technical', 'other')),
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
        priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        admin_response TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create contact_inquiries table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_inquiries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        company VARCHAR(255),
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'resolved')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create updated_at trigger function
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create triggers for updated_at
    const tables = ['users', 'services', 'hosting_packages', 'domain_pricing', 'user_domains', 'user_hosting', 'complaints', 'contact_inquiries'];
    
    for (const table of tables) {
      await pool.query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
        CREATE TRIGGER update_${table}_updated_at
          BEFORE UPDATE ON ${table}
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
    }

    // Insert default data
    console.log('📝 Inserting default data...');

    // Default services
    await pool.query(`
      INSERT INTO services (title, description, icon, features, price_starting, display_order) VALUES
      ('Domain Registration', 'Secure your perfect domain name with competitive pricing for .com and .pk domains.', 'Globe', ARRAY['Instant activation', 'Free DNS management', 'Domain privacy protection', 'Easy domain transfer', '24/7 support'], 3750, 1),
      ('Web Hosting', 'Reliable and fast web hosting solutions with 99.9% uptime guarantee.', 'Server', ARRAY['SSD storage', 'Free SSL certificates', '24/7 technical support', 'cPanel control panel', 'Daily backups'], 2500, 2),
      ('Website Development', 'Professional website development services tailored to your business needs.', 'Code', ARRAY['Custom design', 'Responsive layout', 'SEO optimization', 'Content management', 'Mobile-friendly'], 15000, 3),
      ('Technical Support', 'Round-the-clock technical support for all your hosting and domain needs.', 'Smartphone', ARRAY['24/7 availability', 'Expert technicians', 'Remote assistance', 'Quick response time', 'Multiple support channels'], NULL, 4)
      ON CONFLICT (title) DO NOTHING;
    `);

    // Default hosting packages
    await pool.query(`
      INSERT INTO hosting_packages (name, description, price, storage, bandwidth, email_accounts, databases, features) VALUES
      ('Basic Plan', 'Perfect for small websites and blogs', 2500, '5 GB SSD', '50 GB', 5, 2, ARRAY['Free SSL Certificate', 'cPanel Control Panel', '24/7 Support', 'Daily Backups', 'One-Click WordPress Install']),
      ('Professional Plan', 'Ideal for business websites', 5000, '25 GB SSD', '250 GB', 25, 10, ARRAY['Free SSL Certificate', 'cPanel Control Panel', '24/7 Priority Support', 'Daily Backups', 'One-Click WordPress Install', 'Free Domain for 1 Year', 'Advanced Security']),
      ('Enterprise Plan', 'For high-traffic websites', 10000, '100 GB SSD', 'Unlimited', -1, -1, ARRAY['Free SSL Certificate', 'cPanel Control Panel', '24/7 VIP Support', 'Daily Backups', 'One-Click WordPress Install', 'Free Domain for 1 Year', 'Advanced Security', 'CDN Integration', 'Dedicated IP'])
      ON CONFLICT (name) DO NOTHING;
    `);

    // Default domain pricing
    await pool.query(`
      INSERT INTO domain_pricing (extension, price) VALUES
      ('.com', 6250),
      ('.pk', 3750)
      ON CONFLICT (extension) DO NOTHING;
    `);

    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

createTables();