const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Admin = require('../models/Admin');
const TeacherAccessKey = require('../models/TeacherAccessKey');
const passport = require('passport');

// Generate JWT Token
const generateToken = (user, role) => {
  const payload = { 
    id: user.id, 
    role: role
  };
  
  // Add email if it exists (not for admin)
  if (user.email) {
    payload.email = user.email;
  }
  
  // Add name for admin
  if (role === 'admin' && user.name) {
    payload.name = user.name;
  }
  
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Student Signup
router.post('/student/signup', [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('contactNumber').optional().trim()
], async (req, res) => {
  try {
    console.log('📝 Student Signup Request:', req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, email, password, contactNumber } = req.body;

    // Check capacity limit (max 500 students)
    const studentCount = await Student.count({ where: { isDeleted: false } });
    if (studentCount >= 500) {
      return res.status(400).json({ message: 'Maximum student capacity (500) reached. Cannot register more students.' });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ where: { 
      email,
      isDeleted: false
    } });
    if (existingStudent) {
      console.log('❌ Student already exists:', email);
      return res.status(400).json({ message: 'Student with this email already exists' });
    }

    // Create new student
    console.log('✅ Creating new student...');
    const student = await Student.create({
      fullName,
      email,
      password,
      contactNumber,
      authMethod: 'local'
    });

    console.log('✅ Student created successfully:', student.id);
    const token = generateToken(student, 'student');

    res.status(201).json({
      message: 'Student registered successfully',
      token,
      user: {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        studentId: student.studentId,
        accessKey: student.accessKey,
        role: 'student'
      }
    });
  } catch (error) {
    console.error('❌ Student Signup Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student Login
router.post('/student/login', [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('accessKey').isLength({ min: 7, max: 7 }).withMessage('Access key must be 7 digits')
], async (req, res) => {
  try {
    console.log('🔐 Student Login Request:', { fullName: req.body.fullName, email: req.body.email });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, email, accessKey } = req.body;

    const student = await Student.findOne({ 
      where: { 
        fullName,
        email,
        accessKey 
      } 
    });
    
    if (!student) {
      console.log('❌ Student not found or invalid credentials');
      return res.status(401).json({ message: 'Invalid credentials. Please check your name, email, and access key.' });
    }

    // Prevent deleted users from logging in
    if (student.isDeleted) {
      console.log('❌ Student account deleted:', email);
      return res.status(403).json({ message: 'This account has been deactivated. Please contact administrator.' });
    }

    console.log('✅ Student login successful:', student.id);
    const token = generateToken(student, 'student');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: student.id,
        fullName: student.fullName,
        email: student.email,
        studentId: student.studentId,
        accessKey: student.accessKey,
        profileImage: student.profileImage,
        contactNumber: student.contactNumber,
        role: 'student'
      }
    });
  } catch (error) {
    console.error('❌ Student Login Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Teacher Signup
router.post('/teacher/signup', [
  body('teacherId').trim().isLength({ min: 5, max: 5 }).withMessage('Teacher ID must be 5 digits'),
  body('facultyName').trim().notEmpty().withMessage('Faculty name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { teacherId, facultyName, email, password } = req.body;

    // Verify access key first
    const accessKey = await TeacherAccessKey.findOne({ 
      where: { accessId: teacherId } 
    });

    if (!accessKey) {
      return res.status(403).json({ 
        message: 'Invalid access ID. Please contact admin to get a valid teacher access ID.' 
      });
    }

    if (accessKey.isUsed) {
      return res.status(403).json({ 
        message: 'This access ID has already been used by another teacher.' 
      });
    }

    // Verify teacher name matches
    if (accessKey.teacherName.toLowerCase() !== facultyName.toLowerCase()) {
      return res.status(403).json({ 
        message: 'Teacher name does not match the access ID. Please use the exact name provided by admin.' 
      });
    }

    // Check capacity limit (max 100 teachers)
    const teacherCount = await Teacher.count({ where: { isDeleted: false } });
    if (teacherCount >= 100) {
      return res.status(400).json({ message: 'Maximum teacher capacity (100) reached. Cannot register more teachers.' });
    }

    // Check if teacher already exists with this email
    const existingTeacher = await Teacher.findOne({ 
      where: { 
        email,
        isDeleted: false
      }
    });
    if (existingTeacher) {
      return res.status(400).json({ message: 'Teacher with this email already exists' });
    }

    // Create new teacher
    const teacher = await Teacher.create({
      teacherId,
      facultyName,
      email,
      password,
      authMethod: 'local'
    });

    // Mark access key as used
    accessKey.isUsed = true;
    accessKey.usedBy = teacher.id;
    accessKey.usedAt = new Date();
    await accessKey.save();

    const token = generateToken(teacher, 'teacher');

    res.status(201).json({
      message: 'Teacher registered successfully',
      token,
      user: {
        id: teacher.id,
        teacherId: teacher.teacherId,
        facultyName: teacher.facultyName,
        email: teacher.email,
        role: 'teacher'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Teacher Login
router.post('/teacher/login', [
  body('teacherId').trim().notEmpty().isLength({ min: 5, max: 5 }).withMessage('Teacher ID must be 5 digits'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { teacherId, password } = req.body;

    const teacher = await Teacher.findOne({ where: { teacherId } });
    if (!teacher) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Prevent deleted teachers from logging in
    if (teacher.isDeleted) {
      return res.status(403).json({ message: 'This account has been deactivated. Please contact administrator.' });
    }

    if (teacher.authMethod === 'google') {
      return res.status(400).json({ message: 'Please sign in with Google' });
    }

    const isMatch = await teacher.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(teacher, 'teacher');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: teacher.id,
        teacherId: teacher.teacherId,
        facultyName: teacher.facultyName,
        email: teacher.email,
        role: 'teacher'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin Signup (First time only)
router.post('/admin/signup', [
  body('adminCode').trim().isLength({ min: 5, max: 5 }).withMessage('Admin code must be 5 digits'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { adminCode, name, password } = req.body;

    // Check capacity limit (max 10 admins)
    const adminCount = await Admin.count();
    if (adminCount >= 10) {
      return res.status(400).json({ message: 'Maximum admin capacity (10) reached. Cannot register more admins.' });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ where: { adminCode } });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin with this code already exists' });
    }

    // Create new admin
    const admin = await Admin.create({
      adminCode,
      name,
      password
    });

    const token = generateToken(admin, 'admin');

    res.status(201).json({
      message: 'Admin registered successfully',
      token,
      user: {
        id: admin.id,
        adminCode: admin.adminCode,
        name: admin.name,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin Login
router.post('/admin/login', [
  body('adminCode').trim().isLength({ min: 5, max: 5 }).withMessage('Admin code must be 5 digits'),
  body('name').trim().notEmpty().withMessage('Name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { adminCode, name } = req.body;

    // Find admin by BOTH code AND name (must match exactly)
    const admin = await Admin.findOne({ 
      where: { 
        adminCode: adminCode,
        name: name
      } 
    });
    
    if (!admin) {
      return res.status(401).json({ message: 'Invalid admin code or name' });
    }

    const token = generateToken(admin, 'admin');

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: admin.id,
        adminCode: admin.adminCode,
        name: admin.name,
        role: 'admin',
        isSuperAdmin: admin.isSuperAdmin
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Google OAuth Routes
router.get('/google/:userType', (req, res, next) => {
  req.session.userType = req.params.userType; // student or teacher
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login` }),
  (req, res) => {
    const { user, userType } = req.user;
    const token = generateToken(user, userType);
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}&role=${userType}`);
  }
);

module.exports = router;
