const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const Notification = require('../models/Notification');
const Student = require('../models/Student');

// Create announcement (Teacher/Admin only)
router.post('/', authMiddleware, roleMiddleware('teacher', 'admin'), async (req, res) => {
  try {
    const { title, content, priority, targetAudience } = req.body;
    const teacherId = req.user.id;

    // Get all students if target is 'all'
    let studentIds = [];
    if (targetAudience === 'all') {
      const students = await Student.findAll({
        where: { isDeleted: false },
        attributes: ['id']
      });
      studentIds = students.map(s => s.id);
    }

    // Create notifications for all targeted students
    const notifications = await Promise.all(
      studentIds.map(studentId =>
        Notification.create({
          userId: studentId,
          userRole: 'student',
          title: `📢 ${title}`,
          message: content,
          type: 'announcement',
          priority: priority || 'normal',
          read: false
        })
      )
    );

    console.log(`✅ Announcement created: ${title} | Sent to ${studentIds.length} students`);

    res.json({
      success: true,
      message: 'Announcement sent successfully',
      recipientsCount: studentIds.length
    });
  } catch (error) {
    console.error('❌ Error creating announcement:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all announcements sent by teacher
router.get('/my-announcements', authMiddleware, roleMiddleware('teacher', 'admin'), async (req, res) => {
  try {
    const announcements = await Notification.findAll({
      where: {
        type: 'announcement',
        userRole: 'student'
      },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json({
      success: true,
      announcements
    });
  } catch (error) {
    console.error('❌ Error fetching announcements:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
