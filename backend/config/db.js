const { Sequelize } = require('sequelize');
require('dotenv').config();

// Use PostgreSQL for production (Vercel), SQLite for development
const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      pool: {
        max: 5,          // Maximum number of connections in pool
        min: 0,          // Minimum number of connections in pool
        acquire: 30000,  // Maximum time (ms) to try to get connection
        idle: 10000      // Maximum time (ms) a connection can be idle
      },
      logging: false
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: './database.sqlite',
      logging: false
    });

// Track if database is connected
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('✅ Using existing database connection');
    return true;
  }
  
  try {
    await sequelize.authenticate();
    isConnected = true;
    console.log('✅ Database Connected Successfully');
    
    // DO NOT use sequelize.sync() in production serverless!
    // Tables should already exist from your initial setup
    // Use migrations for schema changes instead
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: false });
      console.log('✅ Database tables synchronized');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database Connection Error:', error.message);
    isConnected = false;
    
    // Don't exit process in serverless environment
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    return false;
  }
};

module.exports = { sequelize, connectDB };
