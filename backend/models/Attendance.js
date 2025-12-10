const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Attendance = sequelize.define('Attendance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  liveClassId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'LiveClasses',
      key: 'id'
    }
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
  studentEmail: {
    type: DataTypes.STRING,
    allowNull: false
  },
  joinedAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('present', 'absent', 'late'),
    defaultValue: 'present'
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = Attendance;
