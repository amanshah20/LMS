const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TeacherAccessKey = sequelize.define('TeacherAccessKey', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  accessId: {
    type: DataTypes.STRING(5),
    allowNull: false,
    unique: true,
    validate: {
      len: [5, 5],
      isNumeric: true
    }
  },
  teacherName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  usedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'teachers',
      key: 'id'
    }
  },
  usedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'admins',
      key: 'id'
    }
  }
}, {
  tableName: 'teacher_access_keys',
  timestamps: true
});

module.exports = TeacherAccessKey;
