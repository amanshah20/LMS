const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  recipientRole: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['student', 'teacher', 'all']]
    }
  },
  recipientId: {
    type: DataTypes.INTEGER
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'general',
    validate: {
      isIn: [['course', 'assignment', 'class', 'announcement', 'grade', 'exam', 'fee', 'general']]
    }
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  priority: {
    type: DataTypes.STRING,
    defaultValue: 'medium',
    validate: {
      isIn: [['low', 'medium', 'high']]
    }
  }
}, {
  tableName: 'notifications',
  timestamps: true
});

module.exports = Notification;
