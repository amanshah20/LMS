const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StudentFee = sequelize.define('StudentFee', {
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
  tuitionFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  examFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  libraryFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  labFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  otherCharges: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  totalFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  paidAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  pendingAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  semester: {
    type: DataTypes.STRING,
    allowNull: true
  },
  academicYear: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'partial', 'paid'),
    defaultValue: 'pending'
  }
}, {
  timestamps: true
});

module.exports = StudentFee;
