const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Startup logging
console.log('🚀 Starting LMS Backend...');
console.log('📍 Environment:', process.env.NODE_ENV || 'development');
console.log('🗄️  Database:', process.env.DATABASE_URL ? 'PostgreSQL (Neon)' : 'SQLite (local)');

// Only load session/passport in development (not needed in production serverless)
const session = process.env.NODE_ENV !== 'production' ? require('express-session') : null;
const passport = process.env.NODE_ENV !== 'production' ? require('passport') : null;

const { connectDB, sequelize } = require('./config/db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const liveClassRoutes = require('./routes/liveClasses');
const messageRoutes = require('./routes/messages');
const studentProfileRoutes = require('./routes/studentProfile');
const studentChatRoutes = require('./routes/studentChat');
const assignmentRoutes = require('./routes/assignments');
const courseRoutes = require('./routes/courses');
const notificationRoutes = require('./routes/notifications');
const teacherAccessKeyRoutes = require('./routes/teacherAccessKeys');
const onlineExamRoutes = require('./routes/onlineExams');
const feeRoutes = require('./routes/fees');

// Models
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Admin = require('./models/Admin');
const LiveClass = require('./models/LiveClass');
const Attendance = require('./models/Attendance');
const Message = require('./models/Message');
const StudentChat = require('./models/StudentChat');
const Assignment = require('./models/Assignment');
const AssignmentSubmission = require('./models/AssignmentSubmission');
const Course = require('./models/Course');
const CourseVideo = require('./models/CourseVideo');
const Notification = require('./models/Notification');
const TeacherAccessKey = require('./models/TeacherAccessKey');
const OnlineExam = require('./models/OnlineExam');
const ExamParticipant = require('./models/ExamParticipant');
const ExamQuestion = require('./models/ExamQuestion');
const ExamAnswer = require('./models/ExamAnswer');
const StudentFee = require('./models/StudentFee');
const FeePayment = require('./models/FeePayment');
const FeeQuery = require('./models/FeeQuery');
const Feedback = require('./models/Feedback');
const Section = require('./models/Section');
const SectionStudent = require('./models/SectionStudent');
const OfflineClass = require('./models/OfflineClass');
const StudentNote = require('./models/StudentNote');
const StudentTodo = require('./models/StudentTodo');
const StudentAIChat = require('./models/StudentAIChat');
const ClassmateMessage = require('./models/ClassmateMessage');

// Initialize Express
const app = express();

// Global error handler for uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

// Initialize database and setup relationships
let dbInitialized = false;

async function initializeDatabase() {
  if (dbInitialized) {
    return true;
  }
  
  try {
    console.log('🔄 Initializing database connection...');
    await connectDB();
    
    // Setup model relationships AFTER DB is connected
    console.log('🔄 Setting up model relationships...');
    setupModelRelationships();
    
    dbInitialized = true;
    console.log('✅ Database initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    dbInitialized = false;
    throw error;
  }
}

function setupModelRelationships() {
Assignment.hasMany(AssignmentSubmission, { foreignKey: 'assignmentId', as: 'submissions' });
AssignmentSubmission.belongsTo(Assignment, { foreignKey: 'assignmentId', as: 'assignment' });
LiveClass.belongsTo(Teacher, { foreignKey: 'teacherId' });
Teacher.hasMany(LiveClass, { foreignKey: 'teacherId' });

Assignment.belongsTo(Teacher, { foreignKey: 'teacherId' });
Teacher.hasMany(Assignment, { foreignKey: 'teacherId' });

Attendance.belongsTo(LiveClass, { foreignKey: 'liveClassId' });
Attendance.belongsTo(Student, { foreignKey: 'studentId' });
LiveClass.hasMany(Attendance, { foreignKey: 'liveClassId' });
Student.hasMany(Attendance, { foreignKey: 'studentId' });

Student.hasMany(StudentChat, { foreignKey: 'studentId' });
StudentChat.belongsTo(Student, { foreignKey: 'studentId' });

Course.hasMany(CourseVideo, { foreignKey: 'courseId', as: 'videos' });
CourseVideo.belongsTo(Course, { foreignKey: 'courseId' });

TeacherAccessKey.belongsTo(Teacher, { foreignKey: 'usedBy', as: 'teacher' });
Teacher.hasOne(TeacherAccessKey, { foreignKey: 'usedBy' });

OnlineExam.belongsTo(Teacher, { foreignKey: 'teacherId', as: 'teacher' });
Teacher.hasMany(OnlineExam, { foreignKey: 'teacherId' });

ExamParticipant.belongsTo(OnlineExam, { foreignKey: 'examId', as: 'exam' });
ExamParticipant.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
OnlineExam.hasMany(ExamParticipant, { foreignKey: 'examId' });
Student.hasMany(ExamParticipant, { foreignKey: 'studentId' });

ExamQuestion.belongsTo(OnlineExam, { foreignKey: 'examId', as: 'exam' });
OnlineExam.hasMany(ExamQuestion, { foreignKey: 'examId', as: 'questions' });

ExamAnswer.belongsTo(OnlineExam, { foreignKey: 'examId', as: 'exam' });
ExamAnswer.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
ExamAnswer.belongsTo(ExamQuestion, { foreignKey: 'questionId', as: 'question' });
OnlineExam.hasMany(ExamAnswer, { foreignKey: 'examId' });
Student.hasMany(ExamAnswer, { foreignKey: 'studentId' });
ExamQuestion.hasMany(ExamAnswer, { foreignKey: 'questionId' });

StudentFee.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
Student.hasMany(StudentFee, { foreignKey: 'studentId' });

FeePayment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });
FeePayment.belongsTo(StudentFee, { foreignKey: 'feeId', as: 'fee' });
Student.hasMany(FeePayment, { foreignKey: 'studentId' });
StudentFee.hasMany(FeePayment, { foreignKey: 'feeId' });

FeeQuery.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Feedback.belongsTo(Teacher, { foreignKey: 'teacherId' });
Feedback.belongsTo(Student, { foreignKey: 'studentId' });
Teacher.hasMany(Feedback, { foreignKey: 'teacherId' });
Student.hasMany(Feedback, { foreignKey: 'studentId' });
Student.hasMany(FeeQuery, { foreignKey: 'studentId' });

// Section associations
Section.belongsTo(Teacher, { foreignKey: 'teacherId' });
Teacher.hasMany(Section, { foreignKey: 'teacherId' });

Section.belongsToMany(Student, { through: SectionStudent, foreignKey: 'sectionId' });
Student.belongsToMany(Section, { through: SectionStudent, foreignKey: 'studentId' });

SectionStudent.belongsTo(Section, { foreignKey: 'sectionId' });
SectionStudent.belongsTo(Student, { foreignKey: 'studentId' });
Section.hasMany(SectionStudent, { foreignKey: 'sectionId' });
Student.hasMany(SectionStudent, { foreignKey: 'studentId' });

// OfflineClass associations
OfflineClass.belongsTo(Section, { foreignKey: 'sectionId' });
OfflineClass.belongsTo(Teacher, { foreignKey: 'teacherId' });
Section.hasMany(OfflineClass, { foreignKey: 'sectionId' });
Teacher.hasMany(OfflineClass, { foreignKey: 'teacherId' });

// Student Tools associations
StudentNote.belongsTo(Student, { foreignKey: 'studentId' });
Student.hasMany(StudentNote, { foreignKey: 'studentId' });

StudentTodo.belongsTo(Student, { foreignKey: 'studentId' });
Student.hasMany(StudentTodo, { foreignKey: 'studentId' });

StudentAIChat.belongsTo(Student, { foreignKey: 'studentId' });
Student.hasMany(StudentAIChat, { foreignKey: 'studentId' });

ClassmateMessage.belongsTo(Student, { foreignKey: 'studentId' });
ClassmateMessage.belongsTo(Section, { foreignKey: 'sectionId' });
Student.hasMany(ClassmateMessage, { foreignKey: 'studentId' });
Section.hasMany(ClassmateMessage, { foreignKey: 'sectionId' });
}

// Initialize database connection lazily
// Don't call connectDB() here - it will be called on first request

// Passport Config (only in development)
if (process.env.NODE_ENV !== 'production' && passport) {
  require('./config/passport')(passport);
}

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed or matches Netlify pattern
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('netlify.app')) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in production (you can restrict this later)
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check (before DB middleware so it always responds)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    dbConnected: dbInitialized
  });
});

// Database connection middleware - ensure DB is connected before each request
app.use(async (req, res, next) => {
  try {
    // Skip DB initialization for health check
    if (req.path === '/api/health') {
      return next();
    }
    
    await initializeDatabase();
    next();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    res.status(503).json({ 
      message: 'Database connection unavailable', 
      error: process.env.NODE_ENV === 'production' ? 'Service temporarily unavailable' : error.message 
    });
  }
});

// Session Middleware (disabled for serverless - use JWT instead)
// Note: Sessions don't persist in serverless environments
// If you need Google OAuth, consider implementing a stateless flow
if (process.env.NODE_ENV !== 'production') {
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  
  // Passport Middleware
  app.use(passport.initialize());
  app.use(passport.session());
}

// Serve static files for uploads (disabled for Vercel - use cloud storage instead)
// Note: Vercel has ephemeral filesystem, uploaded files will be lost
// TODO: Implement Cloudinary or AWS S3 for file uploads
if (process.env.NODE_ENV !== 'production') {
  app.use('/uploads', express.static('uploads'));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', require('./routes/admin'));
app.use('/api/users', userRoutes);
app.use('/api/live-classes', liveClassRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/student/profile', studentProfileRoutes);
app.use('/api/student/chat', studentChatRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/teacher-access-keys', teacherAccessKeyRoutes);
app.use('/api/online-exams', onlineExamRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/sections', require('./routes/sections'));
app.use('/api/offline-classes', require('./routes/offlineClasses'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/student/tools', require('./routes/studentTools'));

// Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  // Handle specific error types
  if (err.name === 'SequelizeConnectionError') {
    return res.status(503).json({ 
      message: 'Database connection error',
      error: process.env.NODE_ENV === 'production' ? 'Service temporarily unavailable' : err.message 
    });
  }
  
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ 
      message: 'Validation error',
      errors: err.errors.map(e => e.message)
    });
  }
  
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start Server (only in development)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, async () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    await initializeDatabase();
  });
}

// Export for serverless (Vercel)
module.exports = app;
