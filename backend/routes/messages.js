const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const Message = require('../models/Message');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// Send message (Admin to students/teachers, Teacher to students only)
router.post('/send', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const { recipientRole, recipientId, subject, message } = req.body;

    // Validate teacher can only send to students
    if (req.user.role === 'teacher' && recipientRole !== 'student') {
      return res.status(403).json({ message: 'Teachers can only send messages to students' });
    }

    // Get sender name based on role
    let senderName = 'Unknown';
    if (req.user.role === 'admin') {
      const admin = await require('../models/Admin').findByPk(req.user.id);
      senderName = admin ? admin.name : 'Admin';
    } else if (req.user.role === 'teacher') {
      const teacher = await Teacher.findByPk(req.user.id);
      senderName = teacher ? teacher.facultyName : 'Teacher';
    }

    // If sending to all, create multiple messages
    if (recipientRole === 'all' || !recipientId) {
      const messages = [];
      
      if (recipientRole === 'student' || recipientRole === 'all') {
        const students = await Student.findAll();
        for (const student of students) {
          messages.push({
            senderRole: req.user.role,
            senderId: req.user.id,
            senderName,
            recipientRole: 'student',
            recipientId: student.id,
            subject,
            message
          });
        }
      }

      if (recipientRole === 'teacher' || recipientRole === 'all') {
        const teachers = await Teacher.findAll();
        for (const teacher of teachers) {
          messages.push({
            senderRole: req.user.role,
            senderId: req.user.id,
            senderName,
            recipientRole: 'teacher',
            recipientId: teacher.id,
            subject,
            message
          });
        }
      }

      await Message.bulkCreate(messages);
      res.status(201).json({ 
        message: `Message sent to ${messages.length} recipients`,
        count: messages.length 
      });
    } else {
      // Send to specific recipient
      const newMessage = await Message.create({
        senderRole: req.user.role,
        senderId: req.user.id,
        senderName,
        recipientRole,
        recipientId,
        subject,
        message
      });

      res.status(201).json({ 
        message: 'Message sent successfully',
        data: newMessage 
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get messages for logged-in user
router.get('/my-messages', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: {
        recipientRole: req.user.role,
        recipientId: req.user.id
      },
      order: [['createdAt', 'DESC']]
    });

    res.json({ messages, count: messages.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark message as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Verify the message belongs to the user
    if (message.recipientId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    message.isRead = true;
    await message.save();

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get sent messages (for admin/teacher)
router.get('/sent', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: {
        senderRole: req.user.role,
        senderId: req.user.id
      },
      order: [['createdAt', 'DESC']]
    });

    res.json({ messages, count: messages.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete message
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findByPk(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is authorized to delete
    if (message.senderId !== req.user.id && message.recipientId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await message.destroy();
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
