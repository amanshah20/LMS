const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const Teacher = sequelize.define('Teacher', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  teacherId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [5, 5]
    }
  },
  facultyName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  authMethod: {
    type: DataTypes.ENUM('local', 'google'),
    defaultValue: 'local'
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'teacher'
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (teacher) => {
      if (teacher.password && teacher.authMethod === 'local') {
        const salt = await bcrypt.genSalt(10);
        teacher.password = await bcrypt.hash(teacher.password, salt);
      }
    },
    beforeUpdate: async (teacher) => {
      if (teacher.changed('password') && teacher.password) {
        const salt = await bcrypt.genSalt(10);
        teacher.password = await bcrypt.hash(teacher.password, salt);
      }
    }
  }
});

// Method to compare passwords
Teacher.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = Teacher;
