const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OnlineExam = sequelize.define('OnlineExam', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  examTitle: {
    type: DataTypes.STRING,
    allowNull: false
  },
  examDescription: {
    type: DataTypes.TEXT
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'teachers',
      key: 'id'
    }
  },
  teacherName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  examDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Duration in minutes'
  },
  totalMarks: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  instructions: {
    type: DataTypes.TEXT
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  lockedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'scheduled',
    validate: {
      isIn: [['scheduled', 'ongoing', 'completed', 'cancelled']]
    }
  },
  resultsPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'admins',
      key: 'id'
    }
  },
  createdByRole: {
    type: DataTypes.ENUM('admin', 'teacher'),
    allowNull: true,
    defaultValue: 'admin',
    comment: 'Indicates whether exam was created by admin or teacher'
  }
}, {
  tableName: 'online_exams',
  timestamps: true
});

module.exports = OnlineExam;
