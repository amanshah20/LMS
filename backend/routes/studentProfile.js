const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for profile image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get student profile
router.get('/profile', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const student = await Student.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json({ student });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update student profile
router.put('/profile', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const { fullName, contactNumber, parentPhoneNumber, address } = req.body;
    
    const student = await Student.findByPk(req.user.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Update fields
    if (fullName) student.fullName = fullName;
    if (contactNumber) student.contactNumber = contactNumber;
    if (parentPhoneNumber) student.parentPhoneNumber = parentPhoneNumber;
    if (address) student.address = address;
    
    await student.save();
    
    // Return updated student without password
    const updatedStudent = student.toJSON();
    delete updatedStudent.password;
    
    res.json({ message: 'Profile updated successfully', student: updatedStudent });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change password
router.put('/change-password', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new password' });
    }
    
    const student = await Student.findByPk(req.user.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if student uses local auth
    if (student.authMethod !== 'local') {
      return res.status(400).json({ message: 'Cannot change password for Google authenticated accounts' });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, student.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    student.password = await bcrypt.hash(newPassword, salt);
    
    await student.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload profile image
router.post('/upload-profile-image', authMiddleware, roleMiddleware('student'), upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const student = await Student.findByPk(req.user.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Delete old profile image if exists
    if (student.profileImage) {
      const oldImagePath = path.join(__dirname, '../uploads/profiles', path.basename(student.profileImage));
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    
    // Save new profile image URL
    student.profileImage = `/uploads/profiles/${req.file.filename}`;
    await student.save();
    
    res.json({ 
      message: 'Profile image uploaded successfully', 
      profileImage: student.profileImage 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
