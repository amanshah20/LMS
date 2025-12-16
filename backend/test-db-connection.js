// Quick test to verify database connection
require('dotenv').config();
const { Sequelize } = require('sequelize');

console.log('🔍 Testing Database Connection...\n');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env file!');
  process.exit(1);
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    },
    connectTimeout: 60000
  },
  pool: {
    max: 3,
    min: 0,
    acquire: 60000,
    idle: 10000
  },
  logging: false
});

async function testConnection() {
  try {
    console.log('🔄 Attempting to connect...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    console.log('\nConnection details:');
    console.log('- Host:', sequelize.config.host);
    console.log('- Database:', sequelize.config.database);
    console.log('- Port:', sequelize.config.port);
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('\nError details:');
    console.error(error.message);
    console.error('\nPossible causes:');
    console.error('1. DATABASE_URL is incorrect');
    console.error('2. Database is suspended/inactive');
    console.error('3. Network/firewall issues');
    console.error('4. SSL configuration problem');
    process.exit(1);
  }
}

testConnection();
