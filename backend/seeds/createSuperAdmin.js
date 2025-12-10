const { sequelize } = require('../config/db');
const Admin = require('../models/Admin');

const createSuperAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if super admin already exists
    const existingSuperAdmin = await Admin.findOne({
      where: { isSuperAdmin: true }
    });

    if (existingSuperAdmin) {
      console.log('ℹ️  Super admin already exists:', existingSuperAdmin.name, existingSuperAdmin.adminCode);
      process.exit(0);
    }

    // Create super admin Aman with ID 98865
    const superAdmin = await Admin.create({
      adminCode: '98865',
      name: 'Aman',
      email: 'aman@admin.com',
      password: 'aman98865', // This will be hashed automatically
      isSuperAdmin: true,
      createdBy: null
    });

    console.log('🎉 Super Admin created successfully!');
    console.log('   Name:', superAdmin.name);
    console.log('   Admin Code:', superAdmin.adminCode);
    console.log('   Email:', superAdmin.email);
    console.log('   Password: aman98865 (change after first login)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    process.exit(1);
  }
};

createSuperAdmin();
