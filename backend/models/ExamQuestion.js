const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ExamQuestion = sequelize.define('ExamQuestion', {
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
  questionText: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  optionA: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  optionB: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  optionC: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  optionD: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  correctAnswer: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['A', 'B', 'C', 'D']]
    }
  },
  marks: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  questionOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  }
}, {
  tableName: 'exam_questions',
  timestamps: true
});

module.exports = ExamQuestion;
