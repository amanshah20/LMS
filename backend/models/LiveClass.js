const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const LiveClass = sequelize.define('LiveClass', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  className: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Teachers',
      key: 'id'
    }
  },
  scheduledDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER, // in minutes
    allowNull: false
  },
  meetingLink: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'ongoing', 'completed', 'cancelled'),
    defaultValue: 'scheduled'
  },
  joinedStudents: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  totalStudents: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = LiveClass;
