const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ClassmateMessage = sequelize.define('ClassmateMessage', {
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
  sectionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Sections',
      key: 'id'
    }
  },
  messageType: {
    type: DataTypes.ENUM('text', 'voice'),
    defaultValue: 'text'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  voiceUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  voiceDuration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in seconds'
  }
}, {
  timestamps: true,
  tableName: 'ClassmateMessages'
});

module.exports = ClassmateMessage;
