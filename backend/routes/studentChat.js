const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const StudentChat = require('../models/StudentChat');
const Student = require('../models/Student');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory for notes
const uploadsDir = path.join(__dirname, '../uploads/notes');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'note-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed!'));
    }
  }
});

// Get all chat messages and notes
router.get('/all', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const chats = await StudentChat.findAll({
      order: [['createdAt', 'DESC']],
      limit: 100
    });
    
    res.json({ chats, count: chats.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Send text message
router.post('/send-message', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || message.trim() === '') {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }
    
    const student = await Student.findByPk(req.user.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const chat = await StudentChat.create({
      studentId: student.id,
      studentName: student.fullName,
      messageType: 'text',
      message: message.trim()
    });
    
    res.status(201).json({ message: 'Message sent successfully', chat });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Upload note (image, PDF, doc)
router.post('/upload-note', authMiddleware, roleMiddleware('student'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const { message } = req.body;
    
    const student = await Student.findByPk(req.user.id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    const fileUrl = `/uploads/notes/${req.file.filename}`;
    const fileType = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    
    const chat = await StudentChat.create({
      studentId: student.id,
      studentName: student.fullName,
      messageType: 'note',
      message: message || 'Shared a note',
      fileName: req.file.originalname,
      fileUrl: fileUrl,
      fileType: fileType
    });
    
    res.status(201).json({ message: 'Note uploaded successfully', chat });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete message (only own messages)
router.delete('/:id', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const chat = await StudentChat.findByPk(id);
    
    if (!chat) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if the message belongs to the current student
    if (chat.studentId !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own messages' });
    }
    
    // Delete file if it's a note
    if (chat.messageType === 'note' && chat.fileUrl) {
      const filePath = path.join(__dirname, '../uploads/notes', path.basename(chat.fileUrl));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await chat.destroy();
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
