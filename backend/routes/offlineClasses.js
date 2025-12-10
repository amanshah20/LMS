const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const OfflineClass = require('../models/OfflineClass');
const Section = require('../models/Section');
const SectionStudent = require('../models/SectionStudent');
const Teacher = require('../models/Teacher');
const Notification = require('../models/Notification');

// Teacher: Create offline class schedule
router.post('/create', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const { sectionId, subject, dayOfWeek, startTime, endTime, roomNumber, classType, notes } = req.body;

    if (!sectionId || !subject || !dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({ message: 'Section, subject, day, and time are required' });
    }

    // Verify section belongs to teacher
    const section = await Section.findOne({
      where: { id: sectionId, teacherId: req.user.id }
    });

    if (!section) {
      return res.status(404).json({ message: 'Section not found or unauthorized' });
    }

    const offlineClass = await OfflineClass.create({
      sectionId,
      teacherId: req.user.id,
      subject,
      dayOfWeek,
      startTime,
      endTime,
      roomNumber,
      classType: classType || 'lecture',
      notes
    });

    // Notify all students in section
    const sectionStudents = await SectionStudent.findAll({
      where: { sectionId }
    });

    const teacher = await Teacher.findByPk(req.user.id);
    
    for (const enrollment of sectionStudents) {
      await Notification.create({
        recipientRole: 'student',
        recipientId: enrollment.studentId,
        title: '📅 New Class Scheduled',
        message: `${subject} class scheduled for ${dayOfWeek} at ${startTime} by ${teacher?.facultyName}`,
        type: 'class',
        priority: 'high'
      });
    }

    console.log('✅ Offline class created:', offlineClass.id);
    res.status(201).json({ 
      success: true, 
      message: 'Offline class scheduled successfully', 
      offlineClass 
    });
  } catch (error) {
    console.error('❌ Error creating offline class:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Teacher: Get all offline classes
router.get('/my-classes', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const offlineClasses = await OfflineClass.findAll({
      where: { teacherId: req.user.id },
      include: [{
        model: Section,
        attributes: ['id', 'sectionName', 'batchYear', 'semester']
      }],
      order: [
        ['dayOfWeek', 'ASC'],
        ['startTime', 'ASC']
      ]
    });

    console.log(`📅 Found ${offlineClasses.length} offline classes`);
    res.json({ success: true, offlineClasses });
  } catch (error) {
    console.error('❌ Error fetching offline classes:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Teacher: Update offline class
router.put('/:classId', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const { classId } = req.params;
    const { subject, dayOfWeek, startTime, endTime, roomNumber, classType, notes } = req.body;

    const offlineClass = await OfflineClass.findOne({
      where: { id: classId, teacherId: req.user.id }
    });

    if (!offlineClass) {
      return res.status(404).json({ message: 'Class not found or unauthorized' });
    }

    await offlineClass.update({
      subject: subject || offlineClass.subject,
      dayOfWeek: dayOfWeek || offlineClass.dayOfWeek,
      startTime: startTime || offlineClass.startTime,
      endTime: endTime || offlineClass.endTime,
      roomNumber: roomNumber !== undefined ? roomNumber : offlineClass.roomNumber,
      classType: classType || offlineClass.classType,
      notes: notes !== undefined ? notes : offlineClass.notes
    });

    console.log('✅ Offline class updated:', classId);
    res.json({ success: true, message: 'Class updated successfully', offlineClass });
  } catch (error) {
    console.error('❌ Error updating offline class:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Teacher: Delete offline class
router.delete('/:classId', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const { classId } = req.params;

    const offlineClass = await OfflineClass.findOne({
      where: { id: classId, teacherId: req.user.id }
    });

    if (!offlineClass) {
      return res.status(404).json({ message: 'Class not found or unauthorized' });
    }

    await offlineClass.destroy();

    console.log('✅ Offline class deleted:', classId);
    res.json({ success: true, message: 'Class deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting offline class:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student: Get my timetable (both online and offline)
router.get('/my-timetable', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    // Get student's sections
    const sectionStudents = await SectionStudent.findAll({
      where: { studentId: req.user.id },
      attributes: ['sectionId']
    });

    const sectionIds = sectionStudents.map(ss => ss.sectionId);

    // Get offline classes for these sections
    const offlineClasses = await OfflineClass.findAll({
      where: { sectionId: sectionIds },
      include: [
        {
          model: Section,
          attributes: ['id', 'sectionName', 'batchYear', 'semester']
        },
        {
          model: Teacher,
          attributes: ['id', 'facultyName', 'email']
        }
      ],
      order: [
        ['dayOfWeek', 'ASC'],
        ['startTime', 'ASC']
      ]
    });

    console.log(`📅 Found ${offlineClasses.length} classes in timetable`);
    res.json({ success: true, offlineClasses });
  } catch (error) {
    console.error('❌ Error fetching timetable:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student: Get offline classes by section
router.get('/section/:sectionId', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const { sectionId } = req.params;

    // Verify student is in this section
    const enrollment = await SectionStudent.findOne({
      where: { sectionId, studentId: req.user.id }
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'You are not enrolled in this section' });
    }

    const offlineClasses = await OfflineClass.findAll({
      where: { sectionId },
      include: [{
        model: Teacher,
        attributes: ['id', 'facultyName', 'email']
      }],
      order: [
        ['dayOfWeek', 'ASC'],
        ['startTime', 'ASC']
      ]
    });

    res.json({ success: true, offlineClasses });
  } catch (error) {
    console.error('❌ Error fetching section classes:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
