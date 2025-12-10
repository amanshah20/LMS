const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OfflineClass = sequelize.define('OfflineClass', {
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
  dayOfWeek: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isIn: [['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']]
    }
  },
  startTime: {
    type: DataTypes.STRING,
    allowNull: false
  },
  endTime: {
    type: DataTypes.STRING,
    allowNull: false
  },
  roomNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  classType: {
    type: DataTypes.STRING,
    defaultValue: 'lecture',
    validate: {
      isIn: [['lecture', 'lab', 'tutorial', 'practical']]
    }
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'offline_classes',
  timestamps: true
});

module.exports = OfflineClass;
