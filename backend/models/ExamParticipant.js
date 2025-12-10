const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ExamParticipant = sequelize.define('ExamParticipant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  examId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'online_exams',
      key: 'id'
    }
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'students',
      key: 'id'
    }
  },
  studentName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  joinedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'registered',
    validate: {
      isIn: [['registered', 'joined', 'submitted', 'absent']]
    }
  },
  marksObtained: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'exam_participants',
  timestamps: true
});

module.exports = ExamParticipant;
