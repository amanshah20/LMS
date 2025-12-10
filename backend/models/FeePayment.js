const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FeePayment = sequelize.define('FeePayment', {
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
  feeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'StudentFees',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM('phonepay', 'googlepay', 'bhim', 'cash', 'online'),
    allowNull: false
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  paymentDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = FeePayment;
