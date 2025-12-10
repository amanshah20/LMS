const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const SectionStudent = sequelize.define('SectionStudent', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sectionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sections',
      key: 'id'
    }
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Students',
      key: 'id'
    }
  },
  enrolledAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'section_students',
  timestamps: true
});

module.exports = SectionStudent;
