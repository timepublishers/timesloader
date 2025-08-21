import pool from '../config/database.js';

const createNewTables = async () => {
  try {
    console.log('🚀 Starting database migration v2...');

    // Create invoices table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invoice_number VARCHAR(50) UNIQUE NOT NULL,
        total_amount INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
        due_date DATE NOT NULL,
        payment_proof_url TEXT,
        payment_message TEXT,
        user_marked_paid_at TIMESTAMP WITH TIME ZONE,
        admin_marked_paid_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create invoice_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
        service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('domain', 'hosting', 'other')),
        service_id UUID,
        description TEXT NOT NULL,
        amount INTEGER NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create other_services table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS other_services (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        amount INTEGER NOT NULL,
        period VARCHAR(20) DEFAULT 'one_time' CHECK (period IN ('one_time', 'monthly', 'yearly')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Update user_domains table with more fields
    await pool.query(`
      DO $$
      BEGIN
        -- Add domain_name column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user_domains' AND column_name = 'domain_name'
        ) THEN
          ALTER TABLE user_domains ADD COLUMN domain_name VARCHAR(255);
        END IF;

        -- Add tld column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user_domains' AND column_name = 'tld'
        ) THEN
          ALTER TABLE user_domains ADD COLUMN tld VARCHAR(10);
        END IF;

        -- Update existing records to split domain_name and extension into domain_name and tld
        UPDATE user_domains 
        SET 
          tld = extension,
          domain_name = CASE 
            WHEN domain_name IS NULL THEN 'example'
            ELSE domain_name
          END
        WHERE tld IS NULL;

        -- Make domain_name NOT NULL after updating
        ALTER TABLE user_domains ALTER COLUMN domain_name SET NOT NULL;
        ALTER TABLE user_domains ALTER COLUMN tld SET NOT NULL;
      END $$;
    `);

    // Update user_hosting table with more fields
    await pool.query(`
      DO $$
      BEGIN
        -- Add tld column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user_hosting' AND column_name = 'tld'
        ) THEN
          ALTER TABLE user_hosting ADD COLUMN tld VARCHAR(10);
        END IF;

        -- Add storage column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user_hosting' AND column_name = 'storage'
        ) THEN
          ALTER TABLE user_hosting ADD COLUMN storage VARCHAR(100);
        END IF;

        -- Add bandwidth column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user_hosting' AND column_name = 'bandwidth'
        ) THEN
          ALTER TABLE user_hosting ADD COLUMN bandwidth VARCHAR(100);
        END IF;

        -- Add email_accounts column if it doesn't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user_hosting' AND column_name = 'email_accounts'
        ) THEN
          ALTER TABLE user_hosting ADD COLUMN email_accounts INTEGER DEFAULT 0;
        END IF;

        -- Update existing records with default values
        UPDATE user_hosting 
        SET 
          tld = '.com',
          storage = '5 GB SSD',
          bandwidth = '50 GB',
          email_accounts = 5
        WHERE tld IS NULL;

        -- Make new columns NOT NULL after updating
        ALTER TABLE user_hosting ALTER COLUMN tld SET NOT NULL;
        ALTER TABLE user_hosting ALTER COLUMN storage SET NOT NULL;
        ALTER TABLE user_hosting ALTER COLUMN bandwidth SET NOT NULL;
        ALTER TABLE user_hosting ALTER COLUMN email_accounts SET NOT NULL;
      END $$;
    `);

    // Create triggers for updated_at
    const newTables = ['invoices', 'invoice_items', 'other_services'];
    
    for (const table of newTables) {
      await pool.query(`
        DROP TRIGGER IF EXISTS update_${table}_updated_at ON ${table};
        CREATE TRIGGER update_${table}_updated_at
          BEFORE UPDATE ON ${table}
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `);
    }

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
      CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
      CREATE INDEX IF NOT EXISTS idx_other_services_user_id ON other_services(user_id);
    `);

    console.log('✅ Database migration v2 completed successfully!');
  } catch (error) {
    console.error('❌ Migration v2 failed:', error);
    process.exit(1);
  }
};

createNewTables();