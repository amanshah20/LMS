const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StudentNote = sequelize.define('StudentNote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Students',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Untitled Note'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'StudentNotes'
});

module.exports = StudentNote;
