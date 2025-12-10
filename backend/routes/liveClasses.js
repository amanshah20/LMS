const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const LiveClass = require('../models/LiveClass');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const { Op } = require('sequelize');

// Create live class (Admin/Teacher)
router.post('/create', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const { className, description, teacherId, scheduledDate, duration, meetingLink } = req.body;
    
    const teacher = await Teacher.findByPk(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    const liveClass = await LiveClass.create({
      className,
      description,
      teacherId,
      scheduledDate,
      duration,
      meetingLink,
      status: 'scheduled'
    });
    
    res.status(201).json({ message: 'Live class created successfully', liveClass });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all live classes
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const liveClasses = await LiveClass.findAll({
      include: [{
        model: Teacher,
        attributes: ['id', 'facultyName', 'email']
      }],
      order: [['scheduledDate', 'DESC']]
    });
    
    res.json({ liveClasses, count: liveClasses.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get live classes for a teacher
router.get('/teacher/:teacherId', authMiddleware, async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    const liveClasses = await LiveClass.findAll({
      where: { teacherId },
      order: [['scheduledDate', 'DESC']]
    });
    
    res.json({ liveClasses, count: liveClasses.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update class status
router.put('/:id/status', authMiddleware, roleMiddleware('teacher', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const liveClass = await LiveClass.findByPk(id);
    if (!liveClass) {
      return res.status(404).json({ message: 'Live class not found' });
    }
    
    liveClass.status = status;
    await liveClass.save();
    
    res.json({ message: 'Status updated successfully', liveClass });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Join class endpoint - for both teachers and students
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const liveClass = await LiveClass.findByPk(id);
    if (!liveClass) {
      return res.status(404).json({ message: 'Live class not found' });
    }
    
    if (liveClass.status !== 'ongoing') {
      return res.status(400).json({ message: 'Class is not currently ongoing' });
    }
    
    // For students, track their join and mark attendance
    if (req.user.role === 'student') {
      const student = await Student.findByPk(req.user.id);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      // Check if already joined
      const existingAttendance = await Attendance.findOne({
        where: { liveClassId: id, studentId: student.id }
      });
      
      if (existingAttendance) {
        return res.json({ 
          message: 'Already joined', 
          meetingLink: liveClass.meetingLink 
        });
      }
      
      // Mark attendance automatically
      await Attendance.create({
        liveClassId: id,
        studentId: student.id,
        studentName: student.fullName,
        studentEmail: student.email,
        joinedAt: new Date(),
        status: 'present',
        verified: true
      });
      
      // Update joined students list
      let joinedStudents = liveClass.joinedStudents || [];
      joinedStudents.push({
        id: student.id,
        name: student.fullName,
        email: student.email,
        joinedAt: new Date()
      });
      
      await liveClass.update({
        joinedStudents,
        totalStudents: joinedStudents.length
      });
    }
    
    res.json({ 
      message: 'Joined successfully', 
      meetingLink: liveClass.meetingLink 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark attendance (Teacher only)
router.post('/:id/attendance', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    const { studentEmail } = req.body;
    
    const liveClass = await LiveClass.findByPk(id);
    if (!liveClass) {
      return res.status(404).json({ message: 'Live class not found' });
    }
    
    const student = await Student.findOne({ where: { email: studentEmail } });
    if (!student) {
      return res.status(404).json({ message: 'Student not found or not enrolled' });
    }
    
    const existingAttendance = await Attendance.findOne({
      where: { liveClassId: id, studentId: student.id }
    });
    
    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already marked for this student' });
    }
    
    const attendance = await Attendance.create({
      liveClassId: id,
      studentId: student.id,
      studentName: student.fullName,
      studentEmail: student.email,
      joinedAt: new Date(),
      status: 'present',
      verified: true
    });
    
    res.status(201).json({ message: 'Attendance marked successfully', attendance });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get attendance for a live class
router.get('/:id/attendance', authMiddleware, roleMiddleware('teacher', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const attendance = await Attendance.findAll({
      where: { liveClassId: id },
      order: [['joinedAt', 'ASC']]
    });
    
    res.json({ attendance, count: attendance.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete live class (Admin only)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const liveClass = await LiveClass.findByPk(id);
    if (!liveClass) {
      return res.status(404).json({ message: 'Live class not found' });
    }
    
    await Attendance.destroy({ where: { liveClassId: id } });
    await liveClass.destroy();
    
    res.json({ message: 'Live class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student's attendance statistics
router.get('/student/my-attendance', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const studentId = req.user.id;
    
    // Get all attendance records for this student
    const attendanceRecords = await Attendance.findAll({
      where: { studentId },
      include: [{
        model: LiveClass,
        attributes: ['className', 'scheduledDate', 'duration']
      }],
      order: [['joinedAt', 'DESC']]
    });
    
    // Get total classes that happened (completed or ongoing)
    const totalClasses = await LiveClass.count({
      where: {
        status: {
          [Op.in]: ['completed', 'ongoing']
        },
        scheduledDate: {
          [Op.lte]: new Date()
        }
      }
    });
    
    // Calculate statistics by month
    const monthlyStats = {};
    const currentDate = new Date();
    
    // Initialize last 5 months
    for (let i = 4; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = date.toLocaleString('en-US', { month: 'short' });
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      monthlyStats[monthYear] = {
        month: monthKey,
        attended: 0,
        total: 0,
        percentage: 0
      };
    }
    
    // Get classes by month for the last 5 months
    const fiveMonthsAgo = new Date();
    fiveMonthsAgo.setMonth(fiveMonthsAgo.getMonth() - 4);
    fiveMonthsAgo.setDate(1);
    
    const classesInPeriod = await LiveClass.findAll({
      where: {
        scheduledDate: {
          [Op.gte]: fiveMonthsAgo,
          [Op.lte]: new Date()
        },
        status: {
          [Op.in]: ['completed', 'ongoing']
        }
      }
    });
    
    // Count total classes per month
    classesInPeriod.forEach(liveClass => {
      const classDate = new Date(liveClass.scheduledDate);
      const monthYear = `${classDate.getFullYear()}-${String(classDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyStats[monthYear]) {
        monthlyStats[monthYear].total++;
      }
    });
    
    // Count attended classes per month
    attendanceRecords.forEach(record => {
      const attendDate = new Date(record.joinedAt);
      const monthYear = `${attendDate.getFullYear()}-${String(attendDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyStats[monthYear]) {
        monthlyStats[monthYear].attended++;
      }
    });
    
    // Calculate percentages
    const monthlyData = Object.values(monthlyStats).map(stat => {
      stat.percentage = stat.total > 0 ? Math.round((stat.attended / stat.total) * 100) : 0;
      return stat;
    });
    
    // Calculate overall statistics
    const attendedClasses = attendanceRecords.length;
    const overallPercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
    
    res.json({
      success: true,
      attendance: {
        attendedClasses,
        totalClasses,
        overallPercentage,
        monthlyData,
        recentAttendance: attendanceRecords.slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
