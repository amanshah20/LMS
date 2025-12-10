const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');

const Student = sequelize.define('Student', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  fullName: {
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
  contactNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  parentPhoneNumber: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  profileImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  studentId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  accessKey: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  authMethod: {
    type: DataTypes.ENUM('local', 'google', 'accessKey'),
    defaultValue: 'local'
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'student'
  },
  batchYear: {
    type: DataTypes.STRING,
    allowNull: true
  },
  semester: {
    type: DataTypes.STRING,
    allowNull: true
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
    beforeCreate: async (student) => {
      if (student.password && student.authMethod === 'local') {
        const salt = await bcrypt.genSalt(10);
        student.password = await bcrypt.hash(student.password, salt);
      }
    },
    beforeUpdate: async (student) => {
      if (student.changed('password') && student.password) {
        const salt = await bcrypt.genSalt(10);
        student.password = await bcrypt.hash(student.password, salt);
      }
    }
  }
});

// Method to compare passwords
Student.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = Student;
