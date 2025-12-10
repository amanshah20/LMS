const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const Feedback = require('../models/Feedback');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Notification = require('../models/Notification');

// Get student's own feedback
router.get('/my-feedback', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    console.log(`💬 Fetching feedback for student ID: ${req.user.id}`);
    const feedback = await Feedback.findAll({
      where: { studentId: req.user.id },
      include: [{
        model: Teacher,
        attributes: ['id', 'facultyName', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    console.log(`✅ Found ${feedback.length} feedback items`);
    res.json({ success: true, feedback });
  } catch (error) {
    console.error('❌ Error fetching feedback:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Teacher: Create feedback for student
router.post('/create', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const { studentId, subject, message, type, rating } = req.body;

    if (!studentId || !message) {
      return res.status(400).json({ message: 'Student ID and message are required' });
    }

    // Check if student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const feedback = await Feedback.create({
      teacherId: req.user.id,
      studentId,
      subject,
      message,
      type: type || 'general',
      rating: rating || null
    });

    // Create notification for the student
    const teacher = await Teacher.findByPk(req.user.id);
    await Notification.create({
      recipientRole: 'student',
      recipientId: studentId,
      title: '💬 New Feedback from Teacher',
      message: `${teacher?.facultyName || 'Your teacher'} has given you feedback${subject ? ' on: ' + subject : ''}`,
      type: 'general',
      priority: 'medium'
    });

    console.log('✅ Feedback created:', feedback.id);
    res.status(201).json({ 
      success: true, 
      message: 'Feedback sent successfully', 
      feedback 
    });
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Teacher: Get all feedback given by the teacher
router.get('/my-given-feedback', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const feedback = await Feedback.findAll({
      where: { teacherId: req.user.id },
      include: [{
        model: Student,
        attributes: ['id', 'studentId', 'fullName', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, feedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Teacher: Update feedback
router.put('/:id', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const { subject, message, type, rating } = req.body;
    const feedback = await Feedback.findByPk(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    if (feedback.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await feedback.update({
      subject: subject || feedback.subject,
      message: message || feedback.message,
      type: type || feedback.type,
      rating: rating !== undefined ? rating : feedback.rating
    });

    res.json({ success: true, message: 'Feedback updated successfully', feedback });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Teacher: Delete feedback
router.delete('/:id', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const feedback = await Feedback.findByPk(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    if (feedback.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await feedback.destroy();
    res.json({ success: true, message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
