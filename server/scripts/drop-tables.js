import pool from '../config/database.js';

const dropTables = async () => {
    try {
        console.log('🔄 Starting to drop all tables...');

        // Drop tables in correct order (respecting foreign key constraints)
        const tables = [
            'user_hosting',
            'complaints',
            'user_domains',
            'domain_pricing',
            'hosting_packages',
            'services',
            'contact_inquiries',
            'users'
        ];

        for (const table of tables) {
            await pool.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
            console.log(`✅ Dropped table: ${table}`);
        }

        // Drop the updated_at trigger function
        await pool.query(`DROP FUNCTION IF EXISTS update_updated_at_column CASCADE`);
        console.log('✅ Dropped update_updated_at_column function');

        console.log('✅ All tables dropped successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error dropping tables:', error);
        process.exit(1);
    }
};

dropTables();