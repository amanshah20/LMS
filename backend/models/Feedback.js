const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Feedback = sequelize.define('Feedback', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Teachers',
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
  subject: {
    type: DataTypes.STRING,
    allowNull: true
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'general',
    validate: {
      isIn: [['assignment', 'exam', 'general', 'behavior']]
    }
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  }
}, {
  tableName: 'feedbacks',
  timestamps: true
});

module.exports = Feedback;
