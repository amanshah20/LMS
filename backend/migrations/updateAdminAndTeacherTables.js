const { sequelize } = require('../config/db');

const updateAdminTable = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Add new columns to Admins table
    const queries = [
      `ALTER TABLE Admins ADD COLUMN email TEXT`,
      `ALTER TABLE Admins ADD COLUMN isSuperAdmin INTEGER DEFAULT 0`,
      `ALTER TABLE Admins ADD COLUMN createdBy INTEGER`
    ];

    for (const query of queries) {
      try {
        await sequelize.query(query);
        console.log('✅', query);
      } catch (error) {
        if (error.message.includes('duplicate column name')) {
          console.log('ℹ️  Column already exists:', query);
        } else {
          throw error;
        }
      }
    }

    // Update TeacherAccessKeys table
    try {
      await sequelize.query(`ALTER TABLE TeacherAccessKeys MODIFY COLUMN accessId VARCHAR(5)`);
      console.log('✅ Updated TeacherAccessKeys.accessId to 5 digits');
    } catch (error) {
      console.log('ℹ️  TeacherAccessKeys.accessId:', error.message);
    }

    // Update Teachers table
    try {
      await sequelize.query(`ALTER TABLE Teachers MODIFY COLUMN teacherId VARCHAR(5)`);
      console.log('✅ Updated Teachers.teacherId to 5 digits');
    } catch (error) {
      console.log('ℹ️  Teachers.teacherId:', error.message);
    }

    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
};

updateAdminTable();
