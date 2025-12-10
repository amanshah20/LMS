const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StudentChat = sequelize.define('StudentChat', {
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
  studentName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  messageType: {
    type: DataTypes.ENUM('text', 'note'),
    defaultValue: 'text'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = StudentChat;
