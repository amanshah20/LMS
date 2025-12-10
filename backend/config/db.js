const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ SQLite Database Connected Successfully');
    
    // Sync all models
    await sequelize.sync();
    console.log('✅ Database tables synchronized');
  } catch (error) {
    console.error('❌ Database Connection Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
