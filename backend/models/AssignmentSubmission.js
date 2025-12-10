const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AssignmentSubmission = sequelize.define('AssignmentSubmission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  assignmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Assignments',
      key: 'id'
    }
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  studentName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  marks: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  gradedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('submitted', 'graded'),
    defaultValue: 'submitted'
  }
}, {
  tableName: 'assignment_submissions',
  timestamps: true
});

// Define associations
AssignmentSubmission.associate = (models) => {
  AssignmentSubmission.belongsTo(models.Assignment, {
    foreignKey: 'assignmentId',
    as: 'assignment'
  });
};

module.exports = AssignmentSubmission;
