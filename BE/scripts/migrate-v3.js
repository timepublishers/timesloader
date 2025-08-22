import pool from '../config/database.js';

const updateTables = async () => {
  try {
    console.log('🚀 Starting database migration v3...');

    // Remove price_paid columns from service tables
    await pool.query(`
      DO $$
      BEGIN
        -- Remove price_paid from user_domains if it exists
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user_domains' AND column_name = 'price_paid'
        ) THEN
          ALTER TABLE user_domains DROP COLUMN price_paid;
        END IF;

        -- Remove price_paid from user_hosting if it exists
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'user_hosting' AND column_name = 'price_paid'
        ) THEN
          ALTER TABLE user_hosting DROP COLUMN price_paid;
        END IF;

        -- Remove amount from other_services if it exists
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'other_services' AND column_name = 'amount'
        ) THEN
          ALTER TABLE other_services DROP COLUMN amount;
        END IF;
      END $$;
    `);

    console.log('✅ Database migration v3 completed successfully!');
  } catch (error) {
    console.error('❌ Migration v3 failed:', error);
    process.exit(1);
  }
};

updateTables();