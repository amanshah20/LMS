const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Admin = require('../models/Admin');

// Get all students (Admin and Teacher can access)
router.get('/students', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const students = await Student.findAll({
      where: { isDeleted: false },
      attributes: ['id', 'studentId', 'fullName', 'email', 'contactNumber', 'accessKey', 'authMethod', 'batchYear', 'semester', 'createdAt']
    });
    res.json({ students, count: students.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all teachers (Admin and Teacher can access)
router.get('/teachers', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const teachers = await Teacher.findAll({
      where: { isDeleted: false },
      attributes: ['id', 'teacherId', 'facultyName', 'email', 'authMethod', 'createdAt']
    });
    res.json({ teachers, count: teachers.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all admins (Admin only)
router.get('/admins', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const admins = await Admin.findAll({
      attributes: ['id', 'adminCode', 'name', 'createdAt']
    });
    res.json({ admins, count: admins.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get system statistics
router.get('/stats', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const studentCount = await Student.count({ where: { isDeleted: false } });
    const teacherCount = await Teacher.count({ where: { isDeleted: false } });
    const adminCount = await Admin.count();
    
    res.json({
      students: studentCount,
      teachers: teacherCount,
      admins: adminCount,
      capacity: {
        students: { current: studentCount, max: 500 },
        teachers: { current: teacherCount, max: 100 },
        admins: { current: adminCount, max: 10 }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Soft delete user (Admin only) - preserves all data
router.delete('/user/:type/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { type, id } = req.params;
    let Model;
    
    if (type === 'student') Model = Student;
    else if (type === 'teacher') Model = Teacher;
    else if (type === 'admin') Model = Admin;
    else return res.status(400).json({ message: 'Invalid user type' });
    
    const user = await Model.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Soft delete for students and teachers - preserve all data
    if (type === 'student' || type === 'teacher') {
      await user.update({
        isDeleted: true,
        deletedAt: new Date()
      });
      console.log(`✅ Soft deleted ${type}:`, id, '- Data preserved in database');
    } else {
      // Hard delete for admins only
      await user.destroy();
      console.log(`⚠️ Hard deleted admin:`, id);
    }
    
    res.json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully` });
  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate access key for student (Admin only)
router.post('/student/:id/generate-key', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Generate 7-digit access key
    const accessKey = Math.floor(1000000 + Math.random() * 9000000).toString();
    
    await student.update({ accessKey });
    
    console.log(`✅ Generated access key for student: ${student.fullName}`);
    res.json({ 
      success: true,
      message: 'Access key generated successfully', 
      accessKey,
      student: {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        accessKey
      }
    });
  } catch (error) {
    console.error('❌ Generate access key error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create student with access key (Admin only)
router.post('/student/create-with-key', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { fullName, email, batchYear, semester } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ message: 'Full name and email are required' });
    }

    // Check if email already exists
    const existingStudent = await Student.findOne({ where: { email } });
    if (existingStudent) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Generate 7-digit access key
    const accessKey = Math.floor(1000000 + Math.random() * 9000000).toString();
    
    // Generate student ID
    const studentCount = await Student.count();
    const studentId = `STU${String(studentCount + 1).padStart(4, '0')}`;

    // Create student record
    const student = await Student.create({
      fullName,
      email,
      accessKey,
      studentId,
      batchYear: batchYear || '2024-2025',
      semester: semester || 'Semester 7',
      authMethod: 'accessKey',
      isDeleted: false
    });
    
    console.log(`✅ Created student with access key: ${fullName} - Key: ${accessKey}`);
    res.json({ 
      success: true,
      message: 'Student created and access key generated', 
      accessKey,
      student: {
        id: student.id,
        studentId: student.studentId,
        fullName: student.fullName,
        email: student.email,
        accessKey: student.accessKey
      }
    });
  } catch (error) {
    console.error('❌ Create student with key error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
