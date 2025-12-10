const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ExamAnswer = sequelize.define('ExamAnswer', {
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
  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'exam_questions',
      key: 'id'
    }
  },
  selectedAnswer: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['A', 'B', 'C', 'D']]
    }
  },
  isCorrect: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  marksAwarded: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'exam_answers',
  timestamps: true
});

module.exports = ExamAnswer;
