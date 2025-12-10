const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StudentAIChat = sequelize.define('StudentAIChat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Students',
      key: 'id'
    }
  },
  role: {
    type: DataTypes.ENUM('user', 'assistant'),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'StudentAIChats'
});

module.exports = StudentAIChat;
