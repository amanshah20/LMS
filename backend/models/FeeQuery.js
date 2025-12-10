const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FeeQuery = sequelize.define('FeeQuery', {
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
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'resolved', 'closed'),
    defaultValue: 'pending'
  },
  adminResponse: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  responseDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = FeeQuery;
