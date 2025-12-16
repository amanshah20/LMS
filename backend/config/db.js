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

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database Connected Successfully');
    
    // Sync all models (disable alter in production to prevent data loss)
    await sequelize.sync({ alter: false });
    console.log('✅ Database tables synchronized');
  } catch (error) {
    console.error('❌ Database Connection Error:', error.message);
    console.error('Full error:', error);
    // Don't exit process in serverless environment
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

module.exports = { sequelize, connectDB };
