const { sequelize } = require('../config/db');

const cleanupOldAdmins = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Get super admin ID
    const [superAdmins] = await sequelize.query(
      `SELECT id FROM Admins WHERE adminCode = '98865' LIMIT 1`
    );

    if (superAdmins.length === 0) {
      console.log('❌ Super admin not found!');
      process.exit(1);
    }

    const superAdminId = superAdmins[0].id;
    console.log('Super Admin ID:', superAdminId);

    // Update all references to old admins (check if tables exist)
    try {
      await sequelize.query(
        `UPDATE teacher_access_keys SET createdBy = ${superAdminId} WHERE createdBy IN (1, 3)`
      );
      console.log('✅ Updated teacher_access_keys references');
    } catch (e) {
      console.log('ℹ️  teacher_access_keys: skipped');
    }

    try {
      await sequelize.query(
        `UPDATE online_exams SET createdBy = ${superAdminId} WHERE createdBy IN (1, 3)`
      );
      console.log('✅ Updated online_exams references');
    } catch (e) {
      console.log('ℹ️  online_exams: skipped');
    }

    // Delete old admins
    await sequelize.query(`DELETE FROM Admins WHERE id IN (1, 3)`);
    console.log('✅ Deleted old admin records');

    // Verify
    const [admins] = await sequelize.query(`SELECT * FROM Admins`);
    console.log('\n🎉 Cleanup complete! Remaining admins:', admins.length);
    admins.forEach(a => {
      console.log('  Code:', a.adminCode, '| Name:', a.name, '| Super:', a.isSuperAdmin === 1);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

cleanupOldAdmins();
