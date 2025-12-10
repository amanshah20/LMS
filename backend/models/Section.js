const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Section = sequelize.define('Section', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sectionName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  batchYear: {
    type: DataTypes.STRING,
    allowNull: false
  },
  semester: {
    type: DataTypes.STRING,
    allowNull: false
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Teachers',
      key: 'id'
    }
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  totalStudents: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'sections',
  timestamps: true
});

module.exports = Section;
