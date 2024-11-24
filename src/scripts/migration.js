const DatabaseService = require('../services/database');

/**
 * Run database migrations
 */
async function runMigration() {
    try {
        console.log('Starting database migration...');
        
        // Create a new instance of DatabaseService
        const db = new DatabaseService();
        
        // Wait for database initialization and connections
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Run the migrations
        await db.addFinalDeadlineColumn();
        await db.migrateExistingDates();
        
        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        console.error('Error details:', error.stack);
        process.exit(1);
    }
}

// Run the migration if this file is executed directly
if (require.main === module) {
    runMigration();
}

module.exports = runMigration; 