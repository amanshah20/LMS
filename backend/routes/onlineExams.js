const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const OnlineExam = require('../models/OnlineExam');
const ExamParticipant = require('../models/ExamParticipant');
const ExamQuestion = require('../models/ExamQuestion');
const ExamAnswer = require('../models/ExamAnswer');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Notification = require('../models/Notification');

// Admin/Teacher: Create Online Exam with Questions
router.post('/create', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const { examTitle, examDescription, teacherId, examDate, duration, totalMarks, instructions, questions, isLocked, createdBy, createdByRole } = req.body;

    console.log('🎯 CREATE EXAM REQUEST:', {
      examTitle,
      teacherId,
      createdByRole,
      isLocked,
      questionsCount: questions?.length
    });

    if (!examTitle || !teacherId || !examDate || !duration) {
      return res.status(400).json({ message: 'Exam title, teacher, date, and duration are required' });
    }

    // Get teacher details
    const teacher = await Teacher.findByPk(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const exam = await OnlineExam.create({
      examTitle,
      examDescription,
      teacherId,
      teacherName: teacher.facultyName,
      examDate,
      duration,
      totalMarks: totalMarks || 100,
      instructions,
      createdBy: createdBy || req.user.id,
      createdByRole: createdByRole || req.user.role, // 'admin' or 'teacher'
      isLocked: isLocked !== undefined ? isLocked : true, // Default to locked
      status: 'scheduled'
    });

    console.log('✅ EXAM CREATED:', {
      id: exam.id,
      title: exam.examTitle,
      createdByRole: exam.createdByRole,
      isLocked: exam.isLocked,
      status: exam.status
    });

    // Create questions if provided
    if (questions && questions.length > 0) {
      const questionData = questions.map((q, index) => ({
        examId: exam.id,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctAnswer: q.correctAnswer,
        marks: q.marks || 1,
        questionOrder: index + 1
      }));
      await ExamQuestion.bulkCreate(questionData);
    }

    // Notify all students
    await Notification.create({
      recipientRole: 'student',
      title: '📝 New Online Exam Scheduled',
      message: `${examTitle} scheduled on ${new Date(examDate).toLocaleString()}. Duration: ${duration} minutes. Monitor: ${teacher.facultyName}`,
      type: 'exam',
      priority: 'high'
    });

    res.status(201).json({
      success: true,
      message: 'Online exam created successfully',
      exam
    });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Get all exams
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const exams = await OnlineExam.findAll({
      include: [
        {
          model: Teacher,
          as: 'teacher',
          attributes: ['id', 'teacherId', 'facultyName']
        }
      ],
      order: [['examDate', 'DESC']]
    });

    res.json({
      success: true,
      exams
    });
  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student: Get available exams
router.get('/student/available', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const now = new Date();

    const exams = await OnlineExam.findAll({
      where: {
        status: 'scheduled'
      },
      attributes: ['id', 'examTitle', 'examDescription', 'examDate', 'duration', 'totalMarks', 'isLocked', 'status', 'teacherId', 'teacherName', 'createdBy', 'createdByRole'],
      include: [
        {
          model: Teacher,
          as: 'teacher',
          attributes: ['facultyName', 'teacherId', 'email']
        }
      ],
      order: [['examDate', 'ASC']]
    });

    // Add canJoin flag based on time and lock status
    const examsWithStatus = exams.map(exam => {
      const examTime = new Date(exam.examDate);
      const twentyMinsBefore = new Date(examTime.getTime() - 20 * 60000);
      const examEndTime = new Date(examTime.getTime() + exam.duration * 60000);
      
      // Student can join if:
      // 1. Exam is not locked
      // 2. Current time is within 20 mins before exam OR during exam time
      const canJoin = !exam.isLocked && now >= twentyMinsBefore && now <= examEndTime;
      
      return {
        ...exam.toJSON(),
        canJoin,
        timeUntilStart: Math.max(0, examTime - now),
        canEnterAt: twentyMinsBefore.toLocaleString(),
        examEndTime: examEndTime.toLocaleString()
      };
    });

    console.log('📚 Available exams for student:', examsWithStatus.map(e => ({
      id: e.id,
      title: e.examTitle,
      createdByRole: e.createdByRole,
      isLocked: e.isLocked
    })));

    res.json({
      success: true,
      exams: examsWithStatus
    });
  } catch (error) {
    console.error('Get available exams error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student: Join exam
router.post('/:id/join', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const examId = req.params.id;
    const exam = await OnlineExam.findByPk(examId);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (exam.isLocked) {
      return res.status(403).json({ message: 'Exam hall is locked. You cannot join now.' });
    }

    const examTime = new Date(exam.examDate);
    const now = new Date();
    const twentyMinsBefore = new Date(examTime.getTime() - 20 * 60000);

    if (now < twentyMinsBefore) {
      return res.status(403).json({ message: 'You can only join 20 minutes before the exam starts' });
    }

    if (now > examTime) {
      return res.status(403).json({ message: 'Exam has already started' });
    }

    // Check if already joined
    let participant = await ExamParticipant.findOne({
      where: { examId, studentId: req.user.id }
    });

    const student = await Student.findByPk(req.user.id);

    if (participant) {
      if (participant.status === 'joined') {
        return res.json({
          success: true,
          message: 'Already joined',
          participant
        });
      }
      participant.status = 'joined';
      participant.joinedAt = new Date();
      await participant.save();
    } else {
      participant = await ExamParticipant.create({
        examId,
        studentId: req.user.id,
        studentName: student.fullName,
        status: 'joined',
        joinedAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Successfully joined the exam',
      participant,
      exam
    });
  } catch (error) {
    console.error('Join exam error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Lock exam hall
router.put('/:id/lock', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const exam = await OnlineExam.findByPk(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    exam.isLocked = true;
    exam.lockedAt = new Date();
    await exam.save();

    res.json({
      success: true,
      message: 'Exam hall locked successfully',
      exam
    });
  } catch (error) {
    console.error('Lock exam error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Unlock exam hall
router.put('/:id/unlock', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const exam = await OnlineExam.findByPk(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    exam.isLocked = false;
    exam.lockedAt = null;
    await exam.save();

    res.json({
      success: true,
      message: 'Exam hall unlocked successfully',
      exam
    });
  } catch (error) {
    console.error('Unlock exam error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin/Teacher: Delete exam
router.delete('/:id', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const examId = req.params.id;
    
    const exam = await OnlineExam.findByPk(examId);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    console.log('🗑️ Deleting exam:', examId);

    // Delete all related data in correct order to avoid foreign key constraints
    try {
      await ExamAnswer.destroy({ where: { examId: examId } });
      console.log('✅ Deleted exam answers');
    } catch (e) {
      console.log('ℹ️  No exam answers to delete');
    }

    try {
      await ExamParticipant.destroy({ where: { examId: examId } });
      console.log('✅ Deleted exam participants');
    } catch (e) {
      console.log('ℹ️  No exam participants to delete');
    }

    try {
      await ExamQuestion.destroy({ where: { examId: examId } });
      console.log('✅ Deleted exam questions');
    } catch (e) {
      console.log('ℹ️  No exam questions to delete');
    }
    
    await exam.destroy();
    console.log('✅ Exam deleted successfully');

    res.json({
      success: true,
      message: 'Exam deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete exam error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin/Teacher: Get exam participants with scores
router.get('/:id/participants', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const exam = await OnlineExam.findByPk(req.params.id);
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const participants = await ExamParticipant.findAll({
      where: { examId: req.params.id },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'fullName', 'email']
        }
      ],
      order: [['joinedAt', 'ASC']]
    });

    // Calculate scores for each participant
    const participantsWithScores = participants.map(p => ({
      ...p.toJSON(),
      totalScore: p.marksObtained || 0,
      percentage: exam.totalMarks > 0 ? ((p.marksObtained || 0) / exam.totalMarks * 100).toFixed(2) : 0
    }));

    res.json({
      success: true,
      participants: participantsWithScores,
      exam: {
        id: exam.id,
        examTitle: exam.examTitle,
        totalMarks: exam.totalMarks,
        resultsPublished: exam.resultsPublished,
        publishedAt: exam.publishedAt
      },
      total: participants.length,
      joined: participants.filter(p => p.status === 'joined').length,
      submitted: participants.filter(p => p.status === 'submitted').length
    });
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin/Teacher: Publish exam results
router.post('/:id/publish-results', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const exam = await OnlineExam.findByPk(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    exam.resultsPublished = true;
    exam.publishedAt = new Date();
    await exam.save();

    // Get all participants who submitted
    const participants = await ExamParticipant.findAll({
      where: { 
        examId: req.params.id,
        status: 'submitted'
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    // Create notification for each student
    const Notification = require('../models/Notification');
    const notificationPromises = participants.map(participant => {
      return Notification.create({
        userId: participant.studentId,
        userType: 'student',
        title: `📊 Results Published: ${exam.examTitle}`,
        message: `Your exam results for "${exam.examTitle}" have been published. Score: ${participant.score}/${exam.totalMarks}`,
        type: 'exam_result',
        read: false
      });
    });

    await Promise.all(notificationPromises);

    res.json({
      success: true,
      message: `Results published successfully to ${participants.length} students`,
      publishedCount: participants.length
    });
  } catch (error) {
    console.error('Publish results error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student: Get exam with questions
router.get('/:id/take-exam', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const exam = await OnlineExam.findByPk(req.params.id, {
      include: [
        {
          model: Teacher,
          as: 'teacher',
          attributes: ['facultyName', 'teacherId']
        },
        {
          model: ExamQuestion,
          as: 'questions',
          attributes: ['id', 'questionText', 'optionA', 'optionB', 'optionC', 'optionD', 'marks', 'questionOrder'],
          order: [['questionOrder', 'ASC']]
        }
      ]
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if locked
    if (exam.isLocked) {
      return res.status(403).json({ message: 'Exam hall is locked by admin' });
    }

    // Check if student already submitted
    const existingParticipant = await ExamParticipant.findOne({
      where: {
        examId: req.params.id,
        studentId: req.user.id,
        status: 'submitted'
      }
    });

    if (existingParticipant) {
      return res.status(403).json({ message: 'You have already submitted this exam' });
    }

    res.json({
      success: true,
      exam
    });
  } catch (error) {
    console.error('Get exam questions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student: Submit exam answers
router.post('/:id/submit', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const { answers } = req.body; // answers: [{ questionId, selectedAnswer }]

    if (!answers || answers.length === 0) {
      return res.status(400).json({ message: 'No answers provided' });
    }

    const exam = await OnlineExam.findByPk(req.params.id, {
      include: [{
        model: ExamQuestion,
        as: 'questions'
      }]
    });

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    let totalScore = 0;
    const answerRecords = [];

    // Process each answer
    for (const ans of answers) {
      const question = exam.questions.find(q => q.id === ans.questionId);
      if (question) {
        const isCorrect = question.correctAnswer === ans.selectedAnswer;
        const marksAwarded = isCorrect ? question.marks : 0;
        totalScore += marksAwarded;

        answerRecords.push({
          examId: exam.id,
          studentId: req.user.id,
          questionId: ans.questionId,
          selectedAnswer: ans.selectedAnswer,
          isCorrect,
          marksAwarded
        });
      }
    }

    // Save all answers
    await ExamAnswer.bulkCreate(answerRecords);

    // Update participant record
    await ExamParticipant.update(
      {
        status: 'submitted',
        submittedAt: new Date(),
        marksObtained: totalScore
      },
      {
        where: {
          examId: exam.id,
          studentId: req.user.id
        }
      }
    );

    res.json({
      success: true,
      message: 'Exam submitted successfully',
      score: totalScore,
      totalMarks: exam.totalMarks
    });
  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Student: Get my exam results (only for published exams)
router.get('/my-results', authMiddleware, roleMiddleware('student'), async (req, res) => {
  try {
    const myResults = await ExamParticipant.findAll({
      where: { 
        studentId: req.user.id,
        status: 'submitted'
      },
      include: [
        {
          model: OnlineExam,
          as: 'exam',
          where: { resultsPublished: true },
          attributes: ['id', 'examTitle', 'examDescription', 'totalMarks', 'examDate', 'publishedAt'],
          include: [
            {
              model: Teacher,
              as: 'teacher',
              attributes: ['facultyName', 'email']
            }
          ]
        }
      ],
      order: [['submittedAt', 'DESC']]
    });

    res.json({
      success: true,
      results: myResults
    });
  } catch (error) {
    console.error('Get my results error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
