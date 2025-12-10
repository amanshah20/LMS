const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Assignment = sequelize.define('Assignment', {
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
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  teacherName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  maxMarks: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100
  },
  course: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fileUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fileType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'active'
  }
}, {
  tableName: 'assignments',
  timestamps: true
});

// Define associations
Assignment.associate = (models) => {
  Assignment.hasMany(models.AssignmentSubmission, {
    foreignKey: 'assignmentId',
    as: 'submissions'
  });
};

module.exports = Assignment;
