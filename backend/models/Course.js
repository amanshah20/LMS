const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  instructor: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING
  },
  thumbnail: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'draft', 'archived']]
    }
  },
  totalLessons: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  duration: {
    type: DataTypes.STRING
  },
  level: {
    type: DataTypes.STRING,
    defaultValue: 'beginner',
    validate: {
      isIn: [['beginner', 'intermediate', 'advanced']]
    }
  }
}, {
  tableName: 'courses',
  timestamps: true
});

module.exports = Course;
