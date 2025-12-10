const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Temporary in-memory storage for alerts
// In production, use database
let alerts = [];

// Get mandatory alerts for student
router.get('/mandatory', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    // Filter alerts for this student that haven't been read
    const studentAlerts = alerts.filter(
      alert => 
        (alert.studentId === req.user.id || alert.studentId === 'all') && 
        !alert.readBy.includes(req.user.id)
    );

    res.json({
      success: true,
      alerts: studentAlerts
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark alert as read
router.put('/:id/read', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const alertIndex = alerts.findIndex(a => a.id === req.params.id);
    
    if (alertIndex === -1) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    // Add student to readBy array
    if (!alerts[alertIndex].readBy.includes(req.user.id)) {
      alerts[alertIndex].readBy.push(req.user.id);
    }

    console.log(`✅ Alert ${req.params.id} marked as read by student ${req.user.id}`);

    res.json({
      success: true,
      message: 'Alert marked as read'
    });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create alert (Admin/Teacher only)
router.post('/create', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const { title, message, details, type, priority, actionRequired, studentId } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const newAlert = {
      id: 'ALERT' + Date.now(),
      title,
      message,
      details: details || '',
      type: type || 'important',
      priority: priority || 'medium',
      actionRequired: actionRequired || '',
      studentId: studentId || 'all', // 'all' means broadcast to all students
      readBy: [],
      createdAt: new Date(),
      createdBy: req.user.id
    };

    alerts.push(newAlert);

    console.log('🔔 New alert created:', newAlert);

    res.json({
      success: true,
      message: 'Alert created successfully',
      alert: newAlert
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all alerts (Admin only)
router.get('/all', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    res.json({
      success: true,
      alerts: alerts
    });
  } catch (error) {
    console.error('Error fetching all alerts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete alert (Admin only)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const alertIndex = alerts.findIndex(a => a.id === req.params.id);
    
    if (alertIndex === -1) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alerts.splice(alertIndex, 1);

    console.log(`🗑️ Alert ${req.params.id} deleted`);

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Initialize with some sample alerts for testing
const initializeSampleAlerts = () => {
  alerts = [
    {
      id: 'ALERT001',
      title: 'Pending Fee Payment',
      message: 'Your semester fee payment is pending. Please pay ₹25,000 before 15th December 2025 to avoid late fees.',
      details: 'You can pay online using PhonePe, Google Pay, BHIM UPI, or Net Banking.',
      type: 'fee',
      priority: 'high',
      actionRequired: 'Pay your pending fees from the Fee Status section',
      studentId: 'all',
      readBy: [],
      createdAt: new Date(),
      createdBy: 'admin'
    },
    {
      id: 'ALERT002',
      title: 'Upcoming Mid-Term Exams',
      message: 'Mid-term examinations will be conducted from 20th December 2025. Please prepare accordingly.',
      details: 'Exam schedule has been uploaded in the Online Exams section. Check your timetable.',
      type: 'exam',
      priority: 'medium',
      actionRequired: 'Review the exam schedule and start preparation',
      studentId: 'all',
      readBy: [],
      createdAt: new Date(),
      createdBy: 'admin'
    }
  ];
  console.log('🔔 Sample alerts initialized');
};

// Initialize sample alerts on server start
initializeSampleAlerts();

module.exports = router;
