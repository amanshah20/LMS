const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const Section = require('../models/Section');
const SectionStudent = require('../models/SectionStudent');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Notification = require('../models/Notification');

// Teacher: Get all sections created by teacher
router.get('/my-sections', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const sections = await Section.findAll({
      where: { teacherId: req.user.id },
      include: [{
        model: Student,
        through: { attributes: ['enrolledAt'] },
        attributes: ['id', 'fullName', 'studentId', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    console.log(`📚 Found ${sections.length} sections for teacher ${req.user.id}`);
    res.json({ success: true, sections });
  } catch (error) {
    console.error('❌ Error fetching sections:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Teacher: Create new section
router.post('/create', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const { sectionName, batchYear, semester, subject, description } = req.body;

    if (!sectionName || !batchYear || !semester || !subject) {
      return res.status(400).json({ message: 'Section name, batch year, semester, and subject are required' });
    }

    const section = await Section.create({
      sectionName,
      batchYear,
      semester,
      teacherId: req.user.id,
      subject,
      description,
      totalStudents: 0
    });

    console.log('✅ Section created:', section.id);
    res.status(201).json({ 
      success: true, 
      message: 'Section created successfully', 
      section 
    });
  } catch (error) {
    console.error('❌ Error creating section:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Teacher: Add student to section
router.post('/:sectionId/add-student', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { studentId } = req.body;

    // Verify section belongs to teacher
    const section = await Section.findOne({
      where: { id: sectionId, teacherId: req.user.id }
    });

    if (!section) {
      return res.status(404).json({ message: 'Section not found or unauthorized' });
    }

    // Check if student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if already enrolled
    const existing = await SectionStudent.findOne({
      where: { sectionId, studentId }
    });

    if (existing) {
      return res.status(400).json({ message: 'Student already enrolled in this section' });
    }

    // Add student to section
    await SectionStudent.create({ sectionId, studentId });

    // Update student count
    const studentCount = await SectionStudent.count({ where: { sectionId } });
    await section.update({ totalStudents: studentCount });

    // Create notification for student
    const teacher = await Teacher.findByPk(req.user.id);
    await Notification.create({
      recipientRole: 'student',
      recipientId: studentId,
      title: '👥 Added to New Section',
      message: `You have been added to ${section.sectionName} (${section.subject}) by ${teacher?.facultyName}`,
      type: 'class',
      priority: 'medium'
    });

    console.log(`✅ Student ${studentId} added to section ${sectionId}`);
    res.json({ 
      success: true, 
      message: 'Student added to section successfully',
      totalStudents: studentCount
    });
  } catch (error) {
    console.error('❌ Error adding student to section:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Teacher: Remove student from section
router.delete('/:sectionId/remove-student/:studentId', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const { sectionId, studentId } = req.params;

    // Verify section belongs to teacher
    const section = await Section.findOne({
      where: { id: sectionId, teacherId: req.user.id }
    });

    if (!section) {
      return res.status(404).json({ message: 'Section not found or unauthorized' });
    }

    // Remove student from section
    const deleted = await SectionStudent.destroy({
      where: { sectionId, studentId }
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Student not found in this section' });
    }

    // Update student count
    const studentCount = await SectionStudent.count({ where: { sectionId } });
    await section.update({ totalStudents: studentCount });

    console.log(`✅ Student ${studentId} removed from section ${sectionId}`);
    res.json({ 
      success: true, 
      message: 'Student removed from section successfully',
      totalStudents: studentCount
    });
  } catch (error) {
    console.error('❌ Error removing student from section:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Teacher: Update section
router.put('/:sectionId', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { sectionName, batchYear, semester, subject, description } = req.body;

    const section = await Section.findOne({
      where: { id: sectionId, teacherId: req.user.id }
    });

    if (!section) {
      return res.status(404).json({ message: 'Section not found or unauthorized' });
    }

    await section.update({
      sectionName: sectionName || section.sectionName,
      batchYear: batchYear || section.batchYear,
      semester: semester || section.semester,
      subject: subject || section.subject,
      description: description !== undefined ? description : section.description
    });

    console.log('✅ Section updated:', sectionId);
    res.json({ success: true, message: 'Section updated successfully', section });
  } catch (error) {
    console.error('❌ Error updating section:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Teacher: Delete section
router.delete('/:sectionId', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const { sectionId } = req.params;

    const section = await Section.findOne({
      where: { id: sectionId, teacherId: req.user.id }
    });

    if (!section) {
      return res.status(404).json({ message: 'Section not found or unauthorized' });
    }

    // Delete all student enrollments first
    await SectionStudent.destroy({ where: { sectionId } });

    // Delete section
    await section.destroy();

    console.log('✅ Section deleted:', sectionId);
    res.json({ success: true, message: 'Section deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting section:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student: Get my sections
router.get('/my-enrolled-sections', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const sectionStudents = await SectionStudent.findAll({
      where: { studentId: req.user.id },
      include: [{
        model: Section,
        include: [{
          model: Teacher,
          attributes: ['id', 'facultyName', 'email']
        }]
      }]
    });

    const sections = sectionStudents.map(ss => ss.Section);
    console.log(`📚 Student ${req.user.id} enrolled in ${sections.length} sections`);
    res.json({ success: true, sections });
  } catch (error) {
    console.error('❌ Error fetching student sections:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student: Get section details with classmates
router.get('/:sectionId/details', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const { sectionId } = req.params;

    // Verify student is in this section
    const enrollment = await SectionStudent.findOne({
      where: { sectionId, studentId: req.user.id }
    });

    if (!enrollment) {
      return res.status(403).json({ message: 'You are not enrolled in this section' });
    }

    const section = await Section.findByPk(sectionId, {
      include: [
        {
          model: Teacher,
          attributes: ['id', 'facultyName', 'email']
        },
        {
          model: Student,
          through: { attributes: ['enrolledAt'] },
          attributes: ['id', 'fullName', 'studentId', 'email']
        }
      ]
    });

    console.log(`✅ Section details fetched for student ${req.user.id}`);
    res.json({ success: true, section });
  } catch (error) {
    console.error('❌ Error fetching section details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
