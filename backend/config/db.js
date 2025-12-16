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
        },
        connectTimeout: 60000
      },
      pool: {
        max: 3,          // Reduced for serverless
        min: 0,
        acquire: 60000,  // Increased timeout
        idle: 10000,
        evict: 10000
      },
      logging: false,
      retry: {
        max: 3
      }
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: './database.sqlite',
      logging: false
    });

// Track if database is connected
let isConnected = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;

const connectDB = async () => {
  if (isConnected) {
    console.log('✅ Using existing database connection');
    return true;
  }
  
  try {
    console.log(`🔄 Attempting database connection (attempt ${connectionAttempts + 1}/${MAX_CONNECTION_ATTEMPTS})...`);
    
    await sequelize.authenticate();
    isConnected = true;
    connectionAttempts = 0; // Reset on success
    
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
    connectionAttempts++;
    
    // Retry logic for transient errors
    if (connectionAttempts < MAX_CONNECTION_ATTEMPTS && 
        (error.message.includes('ECONNREFUSED') || 
         error.message.includes('ETIMEDOUT') ||
         error.message.includes('timeout'))) {
      console.log(`🔄 Retrying connection in 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return connectDB();
    }
    
    // Don't exit process in serverless environment
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    
    throw error; // Re-throw to be handled by caller
  }
};

module.exports = { sequelize, connectDB };
