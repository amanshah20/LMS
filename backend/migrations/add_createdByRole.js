const { sequelize } = require('../config/db');

async function migrate() {
  try {
    console.log('🔄 Starting migration: Adding createdByRole and createdBy columns...');
    
    // Add createdByRole column
    await sequelize.query(`
      ALTER TABLE online_exams ADD COLUMN createdByRole TEXT DEFAULT 'admin';
    `);
    console.log('✅ Column createdByRole added successfully');
    
    // Add createdBy column
    await sequelize.query(`
      ALTER TABLE online_exams ADD COLUMN createdBy INTEGER;
    `);
    console.log('✅ Column createdBy added successfully');
    
    // Update existing records to have createdByRole = 'admin'
    await sequelize.query(`
      UPDATE online_exams SET createdByRole = 'admin' WHERE createdByRole IS NULL;
    `);
    console.log('✅ Updated existing records with default createdByRole');
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('ℹ️  Columns already exist, no migration needed');
      process.exit(0);
    } else {
      console.error('❌ Migration error:', err.message);
      process.exit(1);
    }
  }
}

migrate();
