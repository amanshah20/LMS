const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const StudentTodo = sequelize.define('StudentTodo', {
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
  text: {
    type: DataTypes.STRING,
    allowNull: false
  },
  done: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium'
  }
}, {
  timestamps: true,
  tableName: 'StudentTodos'
});

module.exports = StudentTodo;
