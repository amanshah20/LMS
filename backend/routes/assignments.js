const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Multer configuration for assignment uploads (teacher)
const assignmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/assignments';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'assignment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Multer configuration for submission uploads (student)
const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/submissions';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'submission-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadAssignment = multer({
  storage: assignmentStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only document files (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, ZIP) are allowed'));
    }
  }
});

const uploadSubmission = multer({
  storage: submissionStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|zip/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only document files are allowed'));
    }
  }
});

// Get all assignments with submissions (for students)
router.get('/all', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const assignments = await Assignment.findAll({
      order: [['dueDate', 'ASC']],
      include: [{
        model: AssignmentSubmission,
        as: 'submissions',
        required: false
      }]
    });

    res.json({
      success: true,
      assignments
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
});

// Get all assignments (for teacher - without role restriction)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let assignments;
    
    if (req.user.role === 'teacher') {
      // Teacher gets only their assignments with submissions
      assignments = await Assignment.findAll({
        where: { teacherId: req.user.id },
        order: [['createdAt', 'DESC']],
        include: [{
          model: AssignmentSubmission,
          as: 'submissions',
          required: false
        }]
      });
    } else {
      // Students get all assignments with their submissions
      assignments = await Assignment.findAll({
        order: [['dueDate', 'ASC']],
        include: [{
          model: AssignmentSubmission,
          as: 'submissions',
          required: false,
          where: { studentId: req.user.id }
        }]
      });
    }

    res.json({
      success: true,
      assignments
    });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
});

// Create assignment with file upload (for teachers)
router.post('/', authMiddleware, roleMiddleware('teacher'), uploadAssignment.single('assignmentFile'), async (req, res) => {
  try {
    const { title, description, dueDate, maxMarks, teacherName } = req.body;
    
    if (!title || !dueDate || !maxMarks) {
      return res.status(400).json({ message: 'Title, due date, and max marks are required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Assignment PDF file is required' });
    }

    const assignmentData = {
      title,
      description: description || '',
      teacherId: req.user.id,
      teacherName: teacherName || req.user.facultyName || 'Teacher',
      dueDate,
      maxMarks: parseInt(maxMarks),
      fileUrl: `/uploads/assignments/${req.file.filename}`,
      fileName: req.file.originalname
    };

    const assignment = await Assignment.create(assignmentData);

    res.status(201).json({
      success: true,
      message: 'Assignment created and sent to all students successfully!',
      assignment
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: 'Error creating assignment', error: error.message });
  }
});

// Get assignment by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({
      success: true,
      assignment
    });
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ message: 'Error fetching assignment', error: error.message });
  }
});

// Update assignment (for teachers)
router.put('/:id', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const { title, description, course, dueDate, status } = req.body;
    const assignment = await Assignment.findByPk(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if the teacher owns this assignment
    if (assignment.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'You can only update your own assignments' });
    }

    assignment.title = title || assignment.title;
    assignment.description = description || assignment.description;
    assignment.course = course || assignment.course;
    assignment.dueDate = dueDate || assignment.dueDate;
    assignment.status = status || assignment.status;

    await assignment.save();

    res.json({
      success: true,
      message: 'Assignment updated successfully',
      assignment
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ message: 'Error updating assignment', error: error.message });
  }
});

// Delete assignment (for teachers)
router.delete('/:id', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if the teacher owns this assignment
    if (assignment.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own assignments' });
    }

    // Delete file if exists
    if (assignment.fileUrl) {
      const filePath = path.join(__dirname, '..', assignment.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete all submissions for this assignment
    await AssignmentSubmission.destroy({ where: { assignmentId: assignment.id } });

    await assignment.destroy();

    res.json({
      success: true,
      message: 'Assignment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Error deleting assignment', error: error.message });
  }
});

// Submit assignment (for students)
router.post('/submit', authMiddleware, roleMiddleware('student'), uploadSubmission.single('submissionFile'), async (req, res) => {
  try {
    const { assignmentId, studentName } = req.body;

    if (!assignmentId) {
      return res.status(400).json({ message: 'Assignment ID is required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Submission file is required' });
    }

    // Check if assignment exists
    const assignment = await Assignment.findByPk(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if already submitted
    const existingSubmission = await AssignmentSubmission.findOne({
      where: {
        assignmentId: assignmentId,
        studentId: req.user.id
      }
    });

    if (existingSubmission) {
      return res.status(400).json({ message: 'You have already submitted this assignment' });
    }

    // Create submission
    const submission = await AssignmentSubmission.create({
      assignmentId: parseInt(assignmentId),
      studentId: req.user.id,
      studentName: studentName || req.user.fullName,
      filePath: `/uploads/submissions/${req.file.filename}`,
      fileName: req.file.originalname,
      submittedAt: new Date(),
      status: 'submitted'
    });

    res.status(201).json({
      success: true,
      message: 'Assignment submitted successfully!',
      submission
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ message: 'Error submitting assignment', error: error.message });
  }
});

// Get submissions for an assignment (for teachers)
router.get('/:id/submissions', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.findByPk(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'You can only view submissions for your own assignments' });
    }

    const submissions = await AssignmentSubmission.findAll({
      where: { assignmentId: req.params.id },
      order: [['submittedAt', 'DESC']]
    });

    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Error fetching submissions', error: error.message });
  }
});

// Grade submission (for teachers)
router.put('/submissions/:id/grade', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const { marks, feedback } = req.body;
    
    const submission = await AssignmentSubmission.findByPk(req.params.id, {
      include: [{
        model: Assignment,
        as: 'assignment'
      }]
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Verify teacher owns the assignment
    if (submission.assignment.teacherId !== req.user.id) {
      return res.status(403).json({ message: 'You can only grade submissions for your own assignments' });
    }

    submission.marks = marks;
    submission.feedback = feedback || '';
    submission.gradedAt = new Date();
    submission.status = 'graded';
    
    await submission.save();

    res.json({
      success: true,
      message: 'Submission graded successfully!',
      submission
    });
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({ message: 'Error grading submission', error: error.message });
  }
});

// Get assignments by teacher
router.get('/teacher/my-assignments', authMiddleware, roleMiddleware('teacher'), async (req, res) => {
  try {
    const assignments = await Assignment.findAll({
      where: { teacherId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      assignments
    });
  } catch (error) {
    console.error('Error fetching teacher assignments:', error);
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
});

module.exports = router;
