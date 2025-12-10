const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CourseVideo = sequelize.define('CourseVideo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  videoUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  duration: {
    type: DataTypes.STRING
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'course_videos',
  timestamps: true
});

module.exports = CourseVideo;
