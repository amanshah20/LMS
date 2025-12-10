/**
 * Migration Script: Add resultsPublished and publishedAt columns to OnlineExams table
 * Run this script once to update the existing database schema
 */

const { sequelize } = require('../config/db');

async function addResultsPublishedColumns() {
  try {
    console.log('🔄 Starting migration: Adding resultsPublished and publishedAt columns...');

    // Check if columns already exist
    const [columns] = await sequelize.query(`
      PRAGMA table_info(online_exams);
    `);

    const columnNames = columns.map(col => col.name);
    const hasResultsPublished = columnNames.includes('resultsPublished');
    const hasPublishedAt = columnNames.includes('publishedAt');

    if (hasResultsPublished && hasPublishedAt) {
      console.log('✅ Columns already exist. No migration needed.');
      return;
    }

    // Add resultsPublished column if it doesn't exist
    if (!hasResultsPublished) {
      await sequelize.query(`
        ALTER TABLE online_exams 
        ADD COLUMN resultsPublished INTEGER DEFAULT 0;
      `);
      console.log('✅ Added resultsPublished column');
    }

    // Add publishedAt column if it doesn't exist
    if (!hasPublishedAt) {
      await sequelize.query(`
        ALTER TABLE online_exams 
        ADD COLUMN publishedAt TEXT;
      `);
      console.log('✅ Added publishedAt column');
    }

    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run migration
addResultsPublishedColumns();
