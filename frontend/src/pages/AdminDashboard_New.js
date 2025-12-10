import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService, liveClassService, messageService, courseService, notificationService, teacherAccessKeyService, onlineExamService } from '../services/api';
import AdminFeeManagement from '../components/AdminFeeManagement';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  // Data states
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [accessKeys, setAccessKeys] = useState([]);
  const [onlineExams, setOnlineExams] = useState([]);
  const [examParticipants, setExamParticipants] = useState([]);
  const [viewingExamId, setViewingExamId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form states
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    instructor: '',
    category: '',
    thumbnail: '',
    level: 'beginner',
    videos: []
  });
  
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    duration: ''
  });

  const [messageForm, setMessageForm] = useState({
    recipientRole: 'student',
    subject: '',
    message: ''
  });

  const [studentKeyForm, setStudentKeyForm] = useState({
    fullName: '',
    email: '',
    batchYear: '2024-2025',
    semester: 'Semester 7'
  });

  const [classForm, setClassForm] = useState({
    className: '',
    description: '',
    teacherId: '',
    scheduledDate: '',
    duration: 60,
    meetingLink: ''
  });

  const [accessKeyForm, setAccessKeyForm] = useState({
    teacherName: '',
    email: ''
  });

  const [adminGenerateForm, setAdminGenerateForm] = useState({
    name: '',
    email: '',
    uniqueKey: ''
  });

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [generatedAdmins, setGeneratedAdmins] = useState([]);
  const [generatedAdminCredentials, setGeneratedAdminCredentials] = useState(null);

  const [examForm, setExamForm] = useState({
    examTitle: '',
    examDescription: '',
    teacherId: '',
    examDate: '',
    duration: 60,
    totalMarks: 100,
    instructions: '',
    questions: [],
    totalQuestionsToAdd: 10
  });
  
  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    marks: 1
  });

  useEffect(() => {
    loadData();
    checkSuperAdmin();
    // Apply theme on mount
    document.body.className = theme;
  }, []);

  useEffect(() => {
    // Update theme when it changes
    document.body.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [statsRes, studentsRes, teachersRes, adminsRes, classesRes, coursesRes, accessKeysRes, examsRes] = await Promise.all([
        userService.getStats().catch(() => ({ data: { students: 0, teachers: 0, admins: 0 } })),
        userService.getStudents().catch(() => ({ data: { students: [] } })),
        userService.getTeachers().catch(() => ({ data: { teachers: [] } })),
        userService.getAdmins().catch(() => ({ data: { admins: [] } })),
        liveClassService.getAllClasses().catch(() => ({ data: { liveClasses: [] } })),
        courseService.getAllCourses().catch(() => ({ data: { courses: [] } })),
        teacherAccessKeyService.getAllAccessKeys().catch(() => ({ data: { accessKeys: [] } })),
        onlineExamService.getAllExams().catch(() => ({ data: { exams: [] } }))
      ]);
      
      setStats(statsRes.data);
      setStudents(studentsRes.data.students || []);
      setTeachers(teachersRes.data.teachers || []);
      setAdmins(adminsRes.data.admins || []);
      setLiveClasses(classesRes.data.liveClasses || []);
      setCourses(coursesRes.data.courses || []);
      setAccessKeys(accessKeysRes.data.accessKeys || []);
      setOnlineExams(examsRes.data.exams || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
      setLoading(false);
    }
  };

  const checkSuperAdmin = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/is-super-admin', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setIsSuperAdmin(data.isSuperAdmin || false);
      
      if (data.isSuperAdmin) {
        loadGeneratedAdmins();
      }
    } catch (error) {
      console.error('Error checking super admin status:', error);
    }
  };

  const loadGeneratedAdmins = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/generated-admins', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setGeneratedAdmins(data.admins || []);
    } catch (error) {
      console.error('Error loading generated admins:', error);
    }
  };

  const handleGenerateAdmin = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/generate-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(adminGenerateForm)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`✅ Admin generated successfully!`);
        setGeneratedAdminCredentials(data.admin);
        setAdminGenerateForm({ name: '', email: '', uniqueKey: '' });
        loadGeneratedAdmins();
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      } else {
        setError(data.message || 'Failed to generate admin');
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      console.error('Error generating admin:', error);
      setError('Failed to generate admin');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleAddVideo = () => {
    if (videoForm.title && videoForm.videoUrl) {
      setCourseForm({
        ...courseForm,
        videos: [...courseForm.videos, { ...videoForm, orderIndex: courseForm.videos.length }]
      });
      setVideoForm({ title: '', description: '', videoUrl: '', duration: '' });
    }
  };

  const handleRemoveVideo = (index) => {
    setCourseForm({
      ...courseForm,
      videos: courseForm.videos.filter((_, i) => i !== index)
    });
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const response = await courseService.createCourse(courseForm);
      showSuccess('Course created and notification sent to all students!');
      setCourseForm({
        title: '',
        description: '',
        instructor: '',
        category: '',
        thumbnail: '',
        level: 'beginner',
        videos: []
      });
      loadData();
    } catch (err) {
      console.error('Course creation error:', err);
      showError(err.response?.data?.message || 'Failed to create course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await courseService.deleteCourse(courseId);
      showSuccess('Course deleted successfully');
      loadData();
    } catch (err) {
      showError('Failed to delete course');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      const response = await messageService.sendMessage(messageForm);
      showSuccess('Message sent successfully to all users!');
      setMessageForm({ recipientRole: 'student', subject: '', message: '' });
    } catch (err) {
      console.error('Message send error:', err);
      showError(err.response?.data?.message || 'Failed to send message');
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await liveClassService.createClass(classForm);
      showSuccess('Live class created successfully');
      setClassForm({
        className: '',
        description: '',
        teacherId: '',
        scheduledDate: '',
        duration: 60,
        meetingLink: ''
      });
      loadData();
    } catch (err) {
      showError('Failed to create live class');
    }
  };

  const handleDeleteUser = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      await userService.deleteUser(type, id);
      showSuccess(`${type} deleted successfully`);
      loadData();
    } catch (err) {
      showError(`Failed to delete ${type}`);
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this live class?')) return;
    try {
      await liveClassService.deleteClass(classId);
      showSuccess('Live class deleted successfully');
      loadData();
    } catch (err) {
      showError('Failed to delete live class');
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 4000);
  };

  const handleCreateAccessKey = async (e) => {
    e.preventDefault();
    try {
      const response = await teacherAccessKeyService.createAccessKey(accessKeyForm);
      showSuccess(`Access key created! Teacher ID: ${response.data.data.accessId}`);
      setAccessKeyForm({ teacherName: '', email: '' });
      loadData();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create access key');
    }
  };

  const handleDeleteAccessKey = async (id, isUsed) => {
    if (isUsed) {
      showError('Cannot delete used access key');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this access key?')) return;
    try {
      await teacherAccessKeyService.deleteAccessKey(id);
      showSuccess('Access key deleted successfully');
      loadData();
    } catch (err) {
      showError('Failed to delete access key');
    }
  };

  const handleRegenerateAccessId = async (id) => {
    if (!window.confirm('Generate a new access ID for this teacher?')) return;
    try {
      const response = await teacherAccessKeyService.regenerateAccessId(id);
      showSuccess(`New access ID generated: ${response.data.data.accessId}`);
      loadData();
    } catch (err) {
      showError('Failed to regenerate access ID');
    }
  };

  const handleCopyAccessId = (accessId) => {
    navigator.clipboard.writeText(accessId);
    showSuccess('Access ID copied to clipboard!');
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    try {
      await onlineExamService.createExam(examForm);
      showSuccess('Online exam created and students notified!');
      setExamForm({
        examTitle: '',
        examDescription: '',
        teacherId: '',
        examDate: '',
        duration: 60,
        totalMarks: 100,
        instructions: '',
        questions: [],
        totalQuestionsToAdd: 10
      });
      setCurrentQuestion({
        questionText: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: 'A',
        marks: 1
      });
      loadData();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create exam');
    }
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.questionText || !currentQuestion.optionA || !currentQuestion.optionB || 
        !currentQuestion.optionC || !currentQuestion.optionD) {
      showError('Please fill all question fields');
      return;
    }

    if (examForm.questions.length >= examForm.totalQuestionsToAdd) {
      showError(`Cannot add more than ${examForm.totalQuestionsToAdd} questions`);
      return;
    }
    
    setExamForm({
      ...examForm,
      questions: [...examForm.questions, currentQuestion]
    });
    
    setCurrentQuestion({
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      marks: 1
    });
    
    showSuccess('Question added! Add more or submit exam.');
  };

  const handleRemoveQuestion = (index) => {
    const updated = examForm.questions.filter((_, i) => i !== index);
    setExamForm({ ...examForm, questions: updated });
  };

  const handleViewParticipants = async (examId) => {
    try {
      console.log('Loading participants for exam:', examId);
      console.log('Total students available:', students.length);
      
      const response = await onlineExamService.getParticipants(examId);
      const participants = response.data.participants || [];
      const exam = response.data.exam;
      
      console.log('Exam participants from API:', participants.length);
      console.log('Students state:', students);
      
      // If students array is empty, show only participants
      if (students.length === 0) {
        console.warn('No students loaded. Showing only participants.');
        const participantsWithExam = participants.map(p => ({
          ...p,
          exam: exam,
          gaveExam: true
        }));
        setExamParticipants(participantsWithExam);
        setViewingExamId(examId);
        showSuccess(`Loaded ${participants.length} participants`);
        return;
      }
      
      // Create a list showing all students and their status
      const allStudentsStatus = students.map(student => {
        const participantRecord = participants.find(p => p.student?.id === student.id);
        
        if (participantRecord) {
          // Student gave the exam
          return {
            ...participantRecord,
            student: student,
            exam: exam,
            gaveExam: true
          };
        } else {
          // Student did not give the exam
          return {
            id: `no-exam-${student.id}`,
            student: student,
            exam: exam,
            status: 'not-attempted',
            gaveExam: false,
            marksObtained: null,
            totalScore: null,
            joinedAt: null,
            submittedAt: null
          };
        }
      });
      
      console.log('Final students status array:', allStudentsStatus.length);
      setExamParticipants(allStudentsStatus);
      setViewingExamId(examId);
      showSuccess(`Loaded ${students.length} total students (${participants.length} gave exam)`);
    } catch (err) {
      console.error('Failed to load participants:', err);
      console.error('Error details:', err.response?.data);
      showError(err.response?.data?.message || 'Failed to load participants');
    }
  };

  const handlePublishResults = async (examId) => {
    if (!window.confirm('Publish exam results to all students who submitted? They will receive notifications.')) return;
    try {
      const response = await onlineExamService.publishResults(examId);
      showSuccess(response.data.message || 'Results published successfully!');
      loadData();
      // Reload participants to show updated status
      if (viewingExamId === examId) {
        handleViewParticipants(examId);
      }
    } catch (err) {
      console.error('Failed to publish results:', err);
      showError(err.response?.data?.message || 'Failed to publish results');
    }
  };

  const handleLockExam = async (examId) => {
    if (!window.confirm('Lock this exam hall? Students who haven\'t joined won\'t be able to enter.')) return;
    try {
      await onlineExamService.lockExam(examId);
      showSuccess('Exam hall locked successfully');
      loadData();
    } catch (err) {
      showError('Failed to lock exam');
    }
  };

  const handleUnlockExam = async (examId) => {
    if (!window.confirm('Unlock this exam hall?')) return;
    try {
      await onlineExamService.unlockExam(examId);
      showSuccess('Exam hall unlocked successfully');
      loadData();
    } catch (err) {
      showError('Failed to unlock exam');
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam? This will remove all questions and student submissions.')) return;
    try {
      console.log('Deleting exam:', examId);
      await onlineExamService.deleteExam(examId);
      showSuccess('Exam deleted successfully');
      await loadData();
      // Clear exam participants if viewing deleted exam
      if (viewingExamId === examId) {
        setViewingExamId(null);
        setExamParticipants([]);
      }
    } catch (err) {
      console.error('Delete exam error:', err);
      showError(err.response?.data?.message || 'Failed to delete exam');
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    if (!window.confirm('Are you sure you want to delete this teacher? This action cannot be undone.')) return;
    try {
      await userService.deleteUser('teacher', teacherId);
      showSuccess('Teacher deleted successfully');
      loadData();
    } catch (err) {
      showError('Failed to delete teacher');
    }
  };

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">🎓</span>
            {!sidebarCollapsed && <span className="logo-text">Admin Panel</span>}
          </div>
          <button 
            className="collapse-btn" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand' : 'Collapse'}
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveView('dashboard')}
          >
            <span className="nav-icon">📊</span>
            {!sidebarCollapsed && <span className="nav-text">Dashboard</span>}
          </button>

          <button 
            className={`nav-item ${activeView === 'students' ? 'active' : ''}`}
            onClick={() => setActiveView('students')}
          >
            <span className="nav-icon">👨‍🎓</span>
            {!sidebarCollapsed && <span className="nav-text">Students</span>}
            {!sidebarCollapsed && <span className="nav-badge">{students.length}</span>}
          </button>

          <button 
            className={`nav-item ${activeView === 'teachers' ? 'active' : ''}`}
            onClick={() => setActiveView('teachers')}
          >
            <span className="nav-icon">👨‍🏫</span>
            {!sidebarCollapsed && <span className="nav-text">Teachers</span>}
            {!sidebarCollapsed && <span className="nav-badge">{teachers.length}</span>}
          </button>

          <button 
            className={`nav-item ${activeView === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveView('courses')}
          >
            <span className="nav-icon">📚</span>
            {!sidebarCollapsed && <span className="nav-text">Courses</span>}
            {!sidebarCollapsed && <span className="nav-badge">{courses.length}</span>}
          </button>

          <button 
            className={`nav-item ${activeView === 'classes' ? 'active' : ''}`}
            onClick={() => setActiveView('classes')}
          >
            <span className="nav-icon">📹</span>
            {!sidebarCollapsed && <span className="nav-text">Live Classes</span>}
            {!sidebarCollapsed && <span className="nav-badge">{liveClasses.length}</span>}
          </button>

          <button 
            className={`nav-item ${activeView === 'exams' ? 'active' : ''}`}
            onClick={() => setActiveView('exams')}
          >
            <span className="nav-icon">📝</span>
            {!sidebarCollapsed && <span className="nav-text">Online Exams</span>}
            {!sidebarCollapsed && <span className="nav-badge">{onlineExams.length}</span>}
          </button>

          <button 
            className={`nav-item ${activeView === 'fee-management' ? 'active' : ''}`}
            onClick={() => setActiveView('fee-management')}
          >
            <span className="nav-icon">💰</span>
            {!sidebarCollapsed && <span className="nav-text">Fee Management</span>}
          </button>

          <button 
            className={`nav-item ${activeView === 'student-keys' ? 'active' : ''}`}
            onClick={() => setActiveView('student-keys')}
          >
            <span className="nav-icon">🎓</span>
            {!sidebarCollapsed && <span className="nav-text">Student Keys</span>}
          </button>

          <button 
            className={`nav-item ${activeView === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveView('messages')}
          >
            <span className="nav-icon">💬</span>
            {!sidebarCollapsed && <span className="nav-text">Messages</span>}
          </button>

          <button 
            className={`nav-item ${activeView === 'access-keys' ? 'active' : ''}`}
            onClick={() => setActiveView('access-keys')}
          >
            <span className="nav-icon">🔑</span>
            {!sidebarCollapsed && <span className="nav-text">Teacher Access</span>}
            {!sidebarCollapsed && <span className="nav-badge">{accessKeys.filter(k => !k.isUsed).length}</span>}
          </button>

          <button 
            className={`nav-item ${activeView === 'admins' ? 'active' : ''}`}
            onClick={() => setActiveView('admins')}
          >
            <span className="nav-icon">👨‍💼</span>
            {!sidebarCollapsed && <span className="nav-text">Admins</span>}
            {!sidebarCollapsed && <span className="nav-badge">{admins.length}</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          <button 
            className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveView('settings')}
          >
            <span className="nav-icon">⚙️</span>
            {!sidebarCollapsed && <span className="nav-text">Settings</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-content">
        <div className="content-header">
          <div>
            <h1>
              {activeView === 'dashboard' && '📊 Dashboard Overview'}
              {activeView === 'students' && '👨‍🎓 Students Management'}
              {activeView === 'teachers' && '👨‍🏫 Teachers Management'}
              {activeView === 'courses' && '📚 Courses Management'}
              {activeView === 'classes' && '📹 Live Classes'}
              {activeView === 'exams' && '📝 Online Exams'}
              {activeView === 'fee-management' && '💰 Fee Management'}
              {activeView === 'student-keys' && '🎓 Student Access Keys'}
              {activeView === 'messages' && '💬 Send Messages'}
              {activeView === 'access-keys' && '🔑 Teacher Access Keys'}
              {activeView === 'admins' && '👨‍💼 Admins Management'}
              {activeView === 'settings' && '⚙️ Settings'}
            </h1>
            <p className="header-subtitle">Welcome back, {user?.name}!</p>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {successMessage && <div className="alert alert-success">{successMessage}</div>}

        <div className="content-body">
          {/* Dashboard Overview */}
          {activeView === 'dashboard' && (
            <>
              <div className="stats-grid">
                <div className="stat-card stat-primary">
                  <div className="stat-icon">👨‍🎓</div>
                  <div className="stat-details">
                    <h3>{students.length}</h3>
                    <p>Total Students</p>
                    <small>{500 - students.length} slots remaining</small>
                  </div>
                </div>
                <div className="stat-card stat-success">
                  <div className="stat-icon">👨‍🏫</div>
                  <div className="stat-details">
                    <h3>{teachers.length}</h3>
                    <p>Total Teachers</p>
                    <small>{100 - teachers.length} slots remaining</small>
                  </div>
                </div>
                <div className="stat-card stat-info">
                  <div className="stat-icon">📚</div>
                  <div className="stat-details">
                    <h3>{courses.length}</h3>
                    <p>Total Courses</p>
                    <small>Available for students</small>
                  </div>
                </div>
                <div className="stat-card stat-warning">
                  <div className="stat-icon">📹</div>
                  <div className="stat-details">
                    <h3>{liveClasses.length}</h3>
                    <p>Live Classes</p>
                    <small>Scheduled classes</small>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h2>⚡ Quick Actions</h2>
                <div className="action-grid">
                  <button className="action-btn" onClick={() => setActiveView('courses')}>
                    <span className="action-icon">➕</span>
                    <span>Add New Course</span>
                  </button>
                  <button className="action-btn" onClick={() => setActiveView('classes')}>
                    <span className="action-icon">📹</span>
                    <span>Schedule Class</span>
                  </button>
                  <button className="action-btn" onClick={() => setActiveView('messages')}>
                    <span className="action-icon">💬</span>
                    <span>Send Message</span>
                  </button>
                  <button className="action-btn" onClick={() => setActiveView('students')}>
                    <span className="action-icon">👥</span>
                    <span>Manage Users</span>
                  </button>
                </div>
              </div>

              <div className="recent-activity">
                <h2>📈 Recent Activity</h2>
                <div className="activity-list">
                  <div className="activity-item">
                    <span className="activity-icon">✅</span>
                    <div className="activity-details">
                      <p><strong>{students.length} students</strong> registered in the system</p>
                      <small>Active users</small>
                    </div>
                  </div>
                  <div className="activity-item">
                    <span className="activity-icon">📚</span>
                    <div className="activity-details">
                      <p><strong>{courses.length} courses</strong> available for enrollment</p>
                      <small>Course library</small>
                    </div>
                  </div>
                  <div className="activity-item">
                    <span className="activity-icon">📹</span>
                    <div className="activity-details">
                      <p><strong>{liveClasses.length} live classes</strong> scheduled</p>
                      <small>Upcoming sessions</small>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Students Management */}
          {activeView === 'students' && (
            <div className="data-table-container">
              <div className="table-header">
                <h2>Students List</h2>
                <p>Total: {students.length} / 500 students</p>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Contact</th>
                      <th>Auth Method</th>
                      <th>Joined</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(student => (
                      <tr key={student.id}>
                        <td>{student.id}</td>
                        <td>{student.fullName}</td>
                        <td>{student.email}</td>
                        <td>{student.contactNumber || 'N/A'}</td>
                        <td><span className={`badge badge-${student.authMethod}`}>{student.authMethod}</span></td>
                        <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button 
                            className="btn-delete"
                            onClick={() => handleDeleteUser('student', student.id)}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Teachers Management */}
          {activeView === 'teachers' && (
            <div className="data-table-container">
              <div className="table-header">
                <h2>Teachers List</h2>
                <p>Total: {teachers.length} / 100 teachers</p>
              </div>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Teacher ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Auth Method</th>
                      <th>Joined</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map(teacher => (
                      <tr key={teacher.id}>
                        <td>{teacher.id}</td>
                        <td><strong>{teacher.teacherId}</strong></td>
                        <td>{teacher.facultyName}</td>
                        <td>{teacher.email}</td>
                        <td><span className={`badge badge-${teacher.authMethod}`}>{teacher.authMethod}</span></td>
                        <td>{new Date(teacher.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button 
                            className="btn-delete"
                            onClick={() => handleDeleteUser('teacher', teacher.id)}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Courses Management */}
          {activeView === 'courses' && (
            <>
              <div className="form-card">
                <h2>➕ Create New Course</h2>
                <form onSubmit={handleCreateCourse} className="course-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Course Title *</label>
                      <input
                        type="text"
                        required
                        value={courseForm.title}
                        onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                        placeholder="e.g., Web Development Fundamentals"
                      />
                    </div>
                    <div className="form-group">
                      <label>Instructor Name *</label>
                      <input
                        type="text"
                        required
                        value={courseForm.instructor}
                        onChange={(e) => setCourseForm({...courseForm, instructor: e.target.value})}
                        placeholder="e.g., John Doe"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Category</label>
                      <input
                        type="text"
                        value={courseForm.category}
                        onChange={(e) => setCourseForm({...courseForm, category: e.target.value})}
                        placeholder="e.g., Programming, Design"
                      />
                    </div>
                    <div className="form-group">
                      <label>Level *</label>
                      <select
                        value={courseForm.level}
                        onChange={(e) => setCourseForm({...courseForm, level: e.target.value})}
                        required
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={courseForm.description}
                      onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                      placeholder="Describe what students will learn..."
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label>Thumbnail URL (optional)</label>
                    <input
                      type="url"
                      value={courseForm.thumbnail}
                      onChange={(e) => setCourseForm({...courseForm, thumbnail: e.target.value})}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  {/* Video Section */}
                  <div className="video-section">
                    <h3>📹 Course Videos</h3>
                    
                    <div className="add-video-form">
                      <div className="form-row">
                        <div className="form-group">
                          <label>Video Title</label>
                          <input
                            type="text"
                            value={videoForm.title}
                            onChange={(e) => setVideoForm({...videoForm, title: e.target.value})}
                            placeholder="e.g., Introduction to HTML"
                          />
                        </div>
                        <div className="form-group">
                          <label>Duration (optional)</label>
                          <input
                            type="text"
                            value={videoForm.duration}
                            onChange={(e) => setVideoForm({...videoForm, duration: e.target.value})}
                            placeholder="e.g., 15:30"
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>YouTube Video URL</label>
                        <input
                          type="url"
                          value={videoForm.videoUrl}
                          onChange={(e) => setVideoForm({...videoForm, videoUrl: e.target.value})}
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                      </div>

                      <div className="form-group">
                        <label>Video Description (optional)</label>
                        <textarea
                          value={videoForm.description}
                          onChange={(e) => setVideoForm({...videoForm, description: e.target.value})}
                          placeholder="What will students learn in this video?"
                          rows="2"
                        />
                      </div>

                      <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={handleAddVideo}
                      >
                        ➕ Add Video to Course
                      </button>
                    </div>

                    {courseForm.videos.length > 0 && (
                      <div className="videos-list">
                        <h4>Added Videos ({courseForm.videos.length})</h4>
                        {courseForm.videos.map((video, index) => (
                          <div key={index} className="video-item">
                            <div className="video-info">
                              <span className="video-number">#{index + 1}</span>
                              <div>
                                <strong>{video.title}</strong>
                                {video.duration && <span className="video-duration"> • {video.duration}</span>}
                                <p className="video-url">{video.videoUrl}</p>
                              </div>
                            </div>
                            <button 
                              type="button"
                              className="btn-remove"
                              onClick={() => handleRemoveVideo(index)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button type="submit" className="btn-primary btn-large">
                    ✅ Create Course & Notify Students
                  </button>
                </form>
              </div>

              {/* Existing Courses */}
              <div className="courses-grid">
                <h2>📚 Existing Courses ({courses.length})</h2>
                {courses.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">📚</span>
                    <p>No courses created yet</p>
                    <small>Create your first course above to get started!</small>
                  </div>
                ) : (
                  <div className="courses-list-grid">
                    {courses.map(course => (
                      <div key={course.id} className="course-card-admin">
                        <div className="course-thumbnail">
                          {course.thumbnail ? (
                            <img src={course.thumbnail} alt={course.title} />
                          ) : (
                            <div className="thumbnail-placeholder">📚</div>
                          )}
                        </div>
                        <div className="course-info">
                          <h3>{course.title}</h3>
                          <p className="course-instructor">👨‍🏫 {course.instructor}</p>
                          <p className="course-description">{course.description}</p>
                          <div className="course-meta">
                            <span className={`level-badge level-${course.level}`}>{course.level}</span>
                            <span className="video-count">📹 {course.videos?.length || 0} videos</span>
                          </div>
                          <button 
                            className="btn-delete"
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            🗑️ Delete Course
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Live Classes */}
          {activeView === 'classes' && (
            <>
              <div className="form-card">
                <h2>➕ Create Live Class</h2>
                <form onSubmit={handleCreateClass} className="class-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Class Name *</label>
                      <input
                        type="text"
                        required
                        value={classForm.className}
                        onChange={(e) => setClassForm({...classForm, className: e.target.value})}
                        placeholder="e.g., Mathematics Class"
                      />
                    </div>
                    <div className="form-group">
                      <label>Teacher *</label>
                      <select
                        required
                        value={classForm.teacherId}
                        onChange={(e) => setClassForm({...classForm, teacherId: e.target.value})}
                      >
                        <option value="">Select Teacher</option>
                        {teachers.map(teacher => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.facultyName} (ID: {teacher.teacherId})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={classForm.description}
                      onChange={(e) => setClassForm({...classForm, description: e.target.value})}
                      placeholder="Class description..."
                      rows="3"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Scheduled Date & Time *</label>
                      <input
                        type="datetime-local"
                        required
                        value={classForm.scheduledDate}
                        onChange={(e) => setClassForm({...classForm, scheduledDate: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Duration (minutes) *</label>
                      <input
                        type="number"
                        required
                        min="15"
                        value={classForm.duration}
                        onChange={(e) => setClassForm({...classForm, duration: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Meeting Link (Zoom/Meet)</label>
                    <input
                      type="url"
                      value={classForm.meetingLink}
                      onChange={(e) => setClassForm({...classForm, meetingLink: e.target.value})}
                      placeholder="https://zoom.us/j/..."
                    />
                  </div>

                  <button type="submit" className="btn-primary btn-large">
                    ✅ Create Live Class
                  </button>
                </form>
              </div>

              {/* Existing Classes */}
              <div className="classes-grid">
                <h2>📹 Scheduled Classes ({liveClasses.length})</h2>
                {liveClasses.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">📹</span>
                    <p>No live classes scheduled</p>
                    <small>Create your first class above!</small>
                  </div>
                ) : (
                  <div className="classes-list-grid">
                    {liveClasses.map(liveClass => (
                      <div key={liveClass.id} className="class-card-admin">
                        <div className="class-header">
                          <h3>{liveClass.className}</h3>
                          <span className={`status-badge status-${liveClass.status}`}>
                            {liveClass.status}
                          </span>
                        </div>
                        <p className="class-description">{liveClass.description}</p>
                        <div className="class-details">
                          <p><strong>👨‍🏫 Teacher:</strong> {liveClass.Teacher?.facultyName}</p>
                          <p><strong>📅 Date:</strong> {new Date(liveClass.scheduledDate).toLocaleString()}</p>
                          <p><strong>⏱️ Duration:</strong> {liveClass.duration} minutes</p>
                          {liveClass.meetingLink && (
                            <p><strong>🔗 Link:</strong> <a href={liveClass.meetingLink} target="_blank" rel="noopener noreferrer">Join Class</a></p>
                          )}
                        </div>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteClass(liveClass.id)}
                        >
                          🗑️ Delete Class
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Online Exams */}
          {activeView === 'exams' && (
            <>
              <div className="form-card">
                <h2>➕ Schedule Online Exam</h2>
                <p className="subtitle">Create and schedule online exams with hall lock system</p>
                
                <form onSubmit={handleCreateExam} className="exam-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Exam Title *</label>
                      <input
                        type="text"
                        required
                        value={examForm.examTitle}
                        onChange={(e) => setExamForm({...examForm, examTitle: e.target.value})}
                        placeholder="e.g., Mid-Term Exam - Mathematics"
                      />
                    </div>
                    <div className="form-group">
                      <label>Monitoring Teacher *</label>
                      <select
                        required
                        value={examForm.teacherId}
                        onChange={(e) => setExamForm({...examForm, teacherId: e.target.value})}
                      >
                        <option value="">Select Teacher</option>
                        {teachers.map(teacher => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.facultyName} (ID: {teacher.teacherId})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Total Questions to Add * (Max 100)</label>
                    <select
                      required
                      value={examForm.totalQuestionsToAdd}
                      onChange={(e) => setExamForm({...examForm, totalQuestionsToAdd: parseInt(e.target.value)})}
                      style={{fontSize: '16px', fontWeight: '600', color: '#667eea'}}
                    >
                      {[...Array(100)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1} Question{i > 0 ? 's' : ''}</option>
                      ))}
                    </select>
                    <small style={{color: '#64748b', display: 'block', marginTop: '8px'}}>
                      📌 Select how many questions you want to add to this exam
                    </small>
                  </div>

                  {/* Progress Indicator */}
                  <div className="form-card" style={{
                    background: examForm.questions.length === examForm.totalQuestionsToAdd 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                      : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: 'white',
                    padding: '16px',
                    marginTop: '15px',
                    borderRadius: '8px'
                  }}>
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                      <div>
                        <h4 style={{margin: '0 0 8px 0', fontSize: '16px'}}>
                          {examForm.questions.length === examForm.totalQuestionsToAdd ? '✅' : '⏳'} Questions Progress
                        </h4>
                        <p style={{margin: 0, fontSize: '24px', fontWeight: '700'}}>
                          {examForm.questions.length} / {examForm.totalQuestionsToAdd}
                        </p>
                      </div>
                      <div style={{fontSize: '48px', opacity: 0.3}}>
                        {examForm.questions.length === examForm.totalQuestionsToAdd ? '🎉' : '📝'}
                      </div>
                    </div>
                    {examForm.questions.length < examForm.totalQuestionsToAdd && (
                      <p style={{margin: '12px 0 0 0', fontSize: '13px', opacity: 0.9}}>
                        ⚠️ Add {examForm.totalQuestionsToAdd - examForm.questions.length} more question{examForm.totalQuestionsToAdd - examForm.questions.length > 1 ? 's' : ''} to unlock exam scheduling
                      </p>
                    )}
                    {examForm.questions.length === examForm.totalQuestionsToAdd && (
                      <p style={{margin: '12px 0 0 0', fontSize: '13px', opacity: 0.9}}>
                        🎯 All questions added! You can now schedule the exam below.
                      </p>
                    )}
                  </div>

                  {/* MCQ Questions Section - Show First */}
                  <div className="form-card" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px', borderRadius: '8px', color: 'white', marginTop: '20px'}}>
                    <h3>📝 Add MCQ Questions</h3>
                    <p style={{fontSize: '14px', opacity: 0.9}}>Add {examForm.totalQuestionsToAdd} multiple choice question{examForm.totalQuestionsToAdd > 1 ? 's' : ''} for the exam. Students will select answers during the exam.</p>
                  </div>

                  <div className="form-card" style={{border: '2px dashed #667eea', padding: '20px', marginTop: '15px'}}>
                    <div className="form-group">
                      <label>Question Text *</label>
                      <textarea
                        value={currentQuestion.questionText}
                        onChange={(e) => setCurrentQuestion({...currentQuestion, questionText: e.target.value})}
                        placeholder="Enter your question here..."
                        rows="2"
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Option A *</label>
                        <input
                          type="text"
                          value={currentQuestion.optionA}
                          onChange={(e) => setCurrentQuestion({...currentQuestion, optionA: e.target.value})}
                          placeholder="Option A"
                        />
                      </div>
                      <div className="form-group">
                        <label>Option B *</label>
                        <input
                          type="text"
                          value={currentQuestion.optionB}
                          onChange={(e) => setCurrentQuestion({...currentQuestion, optionB: e.target.value})}
                          placeholder="Option B"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Option C *</label>
                        <input
                          type="text"
                          value={currentQuestion.optionC}
                          onChange={(e) => setCurrentQuestion({...currentQuestion, optionC: e.target.value})}
                          placeholder="Option C"
                        />
                      </div>
                      <div className="form-group">
                        <label>Option D *</label>
                        <input
                          type="text"
                          value={currentQuestion.optionD}
                          onChange={(e) => setCurrentQuestion({...currentQuestion, optionD: e.target.value})}
                          placeholder="Option D"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Correct Answer *</label>
                        <select
                          value={currentQuestion.correctAnswer}
                          onChange={(e) => setCurrentQuestion({...currentQuestion, correctAnswer: e.target.value})}
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Marks</label>
                        <input
                          type="number"
                          min="1"
                          value={currentQuestion.marks}
                          onChange={(e) => setCurrentQuestion({...currentQuestion, marks: parseInt(e.target.value)})}
                        />
                      </div>
                    </div>

                    <button 
                      type="button" 
                      onClick={handleAddQuestion} 
                      className="btn-secondary" 
                      style={{width: '100%'}}
                      disabled={examForm.questions.length >= examForm.totalQuestionsToAdd}
                    >
                      {examForm.questions.length >= examForm.totalQuestionsToAdd 
                        ? `✅ All ${examForm.totalQuestionsToAdd} Questions Added` 
                        : `➕ Add Question to Exam (${examForm.questions.length}/${examForm.totalQuestionsToAdd})`
                      }
                    </button>
                  </div>

                  {/* Display Added Questions */}
                  {examForm.questions.length > 0 && (
                    <div className="form-card" style={{marginTop: '15px', background: '#f0f9ff', padding: '15px'}}>
                      <h4>📋 Added Questions ({examForm.questions.length})</h4>
                      {examForm.questions.map((q, index) => (
                        <div key={index} style={{background: 'white', padding: '10px', marginTop: '10px', borderRadius: '5px', border: '1px solid #ddd'}}>
                          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                            <div style={{flex: 1}}>
                              <strong>Q{index + 1}:</strong> {q.questionText}
                              <div style={{fontSize: '13px', marginTop: '5px', color: '#666'}}>
                                <div>A) {q.optionA}</div>
                                <div>B) {q.optionB}</div>
                                <div>C) {q.optionC}</div>
                                <div>D) {q.optionD}</div>
                                <div style={{color: '#10b981', fontWeight: 'bold', marginTop: '5px'}}>
                                  ✓ Correct: {q.correctAnswer} | Marks: {q.marks}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(index)}
                              style={{background: '#ef4444', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px'}}
                            >
                              🗑️ Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Exam Scheduling - Only show after all questions added */}
                  {examForm.questions.length === examForm.totalQuestionsToAdd && (
                    <>
                      <div className="form-card" style={{background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', padding: '20px', borderRadius: '8px', color: 'white', marginTop: '20px'}}>
                        <h3>📅 Exam Scheduling & Details</h3>
                        <p style={{fontSize: '14px', opacity: 0.9}}>All questions added! Now schedule the exam date and configure final details.</p>
                      </div>

                      <div className="form-group" style={{marginTop: '15px'}}>
                        <label>Exam Description</label>
                        <textarea
                          value={examForm.examDescription}
                          onChange={(e) => setExamForm({...examForm, examDescription: e.target.value})}
                          placeholder="Brief description about the exam..."
                          rows="2"
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Exam Date & Time *</label>
                          <input
                            type="datetime-local"
                            required
                            value={examForm.examDate}
                            onChange={(e) => setExamForm({...examForm, examDate: e.target.value})}
                          />
                          <small style={{color: '#64748b', marginTop: '4px'}}>
                            Students can join 20 minutes before this time
                          </small>
                        </div>
                        <div className="form-group">
                          <label>Duration (minutes) *</label>
                          <input
                            type="number"
                            required
                            min="15"
                            value={examForm.duration}
                            onChange={(e) => setExamForm({...examForm, duration: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Total Marks *</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={examForm.totalMarks}
                            onChange={(e) => setExamForm({...examForm, totalMarks: e.target.value})}
                          />
                        </div>
                        <div className="form-group"></div>
                      </div>

                      <div className="form-group">
                        <label>Instructions</label>
                        <textarea
                          value={examForm.instructions}
                          onChange={(e) => setExamForm({...examForm, instructions: e.target.value})}
                          placeholder="Exam rules and instructions for students..."
                          rows="3"
                        />
                      </div>
                    </>
                  )}

                  <button 
                    type="submit" 
                    className="btn-primary btn-large" 
                    style={{marginTop: '20px'}}
                    disabled={examForm.questions.length !== examForm.totalQuestionsToAdd}
                  >
                    {examForm.questions.length === examForm.totalQuestionsToAdd 
                      ? `✅ Schedule Exam & Notify Students (${examForm.questions.length} Questions)` 
                      : `⏳ Add ${examForm.totalQuestionsToAdd - examForm.questions.length} More Question${examForm.totalQuestionsToAdd - examForm.questions.length > 1 ? 's' : ''} to Continue`
                    }
                  </button>
                </form>
              </div>

              {/* Existing Exams */}
              <div className="data-table-container">
                <div className="table-header">
                  <h2>📝 Scheduled Online Exams</h2>
                  <p>Total: {onlineExams.length} exams</p>
                </div>
                
                {onlineExams.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">📝</span>
                    <p>No exams scheduled yet</p>
                    <small>Schedule your first exam above!</small>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Exam Title</th>
                          <th>Teacher Monitor</th>
                          <th>Date & Time</th>
                          <th>Duration</th>
                          <th>Total Marks</th>
                          <th>Status</th>
                          <th>Hall Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {onlineExams.map(exam => {
                          const examTime = new Date(exam.examDate);
                          const now = new Date();
                          const isUpcoming = examTime > now;
                          
                          return (
                            <tr key={exam.id}>
                              <td>
                                <strong>{exam.examTitle}</strong>
                                {exam.examDescription && (
                                  <p style={{margin: '4px 0 0 0', fontSize: '12px', color: '#64748b'}}>
                                    {exam.examDescription}
                                  </p>
                                )}
                              </td>
                              <td>
                                <div>
                                  <strong>{exam.teacherName}</strong>
                                  <br />
                                  <small style={{color: '#64748b'}}>
                                    ID: {exam.teacher?.teacherId}
                                  </small>
                                </div>
                              </td>
                              <td>
                                {examTime.toLocaleDateString()}
                                <br />
                                <small style={{color: '#64748b'}}>
                                  {examTime.toLocaleTimeString()}
                                </small>
                              </td>
                              <td>{exam.duration} min</td>
                              <td>{exam.totalMarks}</td>
                              <td>
                                <span className={`badge badge-${exam.status}`}>
                                  {exam.status}
                                </span>
                              </td>
                              <td>
                                {exam.isLocked ? (
                                  <span style={{color: '#dc2626', fontWeight: '600'}}>
                                    🔒 Locked
                                  </span>
                                ) : (
                                  <span style={{color: '#059669', fontWeight: '600'}}>
                                    🔓 Open
                                  </span>
                                )}
                                {exam.lockedAt && (
                                  <p style={{margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8'}}>
                                    {new Date(exam.lockedAt).toLocaleTimeString()}
                                  </p>
                                )}
                              </td>
                              <td>
                                <div style={{display: 'flex', gap: '8px', flexDirection: 'column'}}>
                                  {isUpcoming && (
                                    <>
                                      {exam.isLocked ? (
                                        <button
                                          onClick={() => handleUnlockExam(exam.id)}
                                          style={{
                                            padding: '6px 12px',
                                            background: '#dcfce7',
                                            border: 'none',
                                            borderRadius: '6px',
                                            color: '#166534',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            fontWeight: '600'
                                          }}
                                        >
                                          🔓 Unlock Hall
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleLockExam(exam.id)}
                                          style={{
                                            padding: '6px 12px',
                                            background: '#fee2e2',
                                            border: 'none',
                                            borderRadius: '6px',
                                            color: '#991b1b',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            fontWeight: '600'
                                          }}
                                        >
                                          🔒 Lock Hall
                                        </button>
                                      )}
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleViewParticipants(exam.id)}
                                    style={{
                                      padding: '8px 16px',
                                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                      border: 'none',
                                      borderRadius: '8px',
                                      color: 'white',
                                      cursor: 'pointer',
                                      fontSize: '14px',
                                      fontWeight: '600',
                                      whiteSpace: 'nowrap',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                                      transition: 'all 0.3s ease'
                                    }}
                                    onMouseOver={(e) => {
                                      e.currentTarget.style.transform = 'translateY(-2px)';
                                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                                    }}
                                    onMouseOut={(e) => {
                                      e.currentTarget.style.transform = 'translateY(0)';
                                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.3)';
                                    }}
                                  >
                                    📊 View Results
                                  </button>
                                  <button 
                                    className="btn-delete"
                                    onClick={() => handleDeleteExam(exam.id)}
                                    style={{
                                      padding: '8px 16px',
                                      fontSize: '14px',
                                      fontWeight: '600',
                                      whiteSpace: 'nowrap',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                      border: 'none',
                                      borderRadius: '8px',
                                      color: 'white',
                                      cursor: 'pointer',
                                      boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
                                      transition: 'all 0.3s ease'
                                    }}
                                    onMouseOver={(e) => {
                                      e.currentTarget.style.transform = 'translateY(-2px)';
                                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.4)';
                                    }}
                                    onMouseOut={(e) => {
                                      e.currentTarget.style.transform = 'translateY(0)';
                                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
                                    }}
                                  >
                                    🗑️ Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Info Card */}
              <div className="form-card" style={{background: 'linear-gradient(135deg, #0c4a6e 0%, #075985 100%)', color: 'white'}}>
                <h2 style={{color: 'white'}}>ℹ️ Exam Hall Lock System</h2>
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px'}}>
                  <p style={{margin: 0, display: 'flex', alignItems: 'start', gap: '12px'}}>
                    <span style={{fontSize: '20px'}}>🕐</span>
                    <span>Students can join the exam hall 20 minutes before the scheduled time</span>
                  </p>
                  <p style={{margin: 0, display: 'flex', alignItems: 'start', gap: '12px'}}>
                    <span style={{fontSize: '20px'}}>🔒</span>
                    <span>Admin can lock the exam hall to prevent late students from joining</span>
                  </p>
                  <p style={{margin: 0, display: 'flex', alignItems: 'start', gap: '12px'}}>
                    <span style={{fontSize: '20px'}}>⏰</span>
                    <span>Once locked, students cannot enter even if they try before exam time</span>
                  </p>
                  <p style={{margin: 0, display: 'flex', alignItems: 'start', gap: '12px'}}>
                    <span style={{fontSize: '20px'}}>🔓</span>
                    <span>Admin can unlock the hall at any time if needed</span>
                  </p>
                  <p style={{margin: 0, display: 'flex', alignItems: 'start', gap: '12px'}}>
                    <span style={{fontSize: '20px'}}>👨‍🏫</span>
                    <span>Assigned teacher monitors and supervises the exam</span>
                  </p>
                </div>
              </div>

              {/* Exam Results View */}
              {viewingExamId && examParticipants.length > 0 && (
                <div className="form-card" style={{marginTop: '20px', background: '#f8fafc'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                    <h2>📊 Exam Results & Participants</h2>
                    <button 
                      className="btn-secondary"
                      onClick={() => {
                        setViewingExamId(null);
                        setExamParticipants([]);
                      }}
                    >
                      ✖️ Close
                    </button>
                  </div>

                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px'}}>
                    <div className="stat-card">
                      <div className="stat-icon">👥</div>
                      <div className="stat-info">
                        <h3>Total Students</h3>
                        <p className="stat-number">{examParticipants.length}</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">📝</div>
                      <div className="stat-info">
                        <h3>Gave Exam</h3>
                        <p className="stat-number">{examParticipants.filter(p => p.gaveExam).length}</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">❌</div>
                      <div className="stat-info">
                        <h3>Didn't Attempt</h3>
                        <p className="stat-number">{examParticipants.filter(p => !p.gaveExam).length}</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">✅</div>
                      <div className="stat-info">
                        <h3>Submitted</h3>
                        <p className="stat-number">{examParticipants.filter(p => p.status === 'submitted').length}</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">⏳</div>
                      <div className="stat-info">
                        <h3>In Progress</h3>
                        <p className="stat-number">{examParticipants.filter(p => p.status === 'joined').length}</p>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-icon">📈</div>
                      <div className="stat-info">
                        <h3>Average Score</h3>
                        <p className="stat-number">
                          {examParticipants.filter(p => p.status === 'submitted').length > 0 
                            ? (examParticipants
                                .filter(p => p.status === 'submitted')
                                .reduce((sum, p) => sum + (p.totalScore || p.marksObtained || 0), 0) / 
                                examParticipants.filter(p => p.status === 'submitted').length).toFixed(1)
                            : 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="data-table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Student Name</th>
                          <th>Email</th>
                          <th>Score</th>
                          <th>Status</th>
                          <th>Joined At</th>
                          <th>Submitted At</th>
                        </tr>
                      </thead>
                      <tbody>
                        {examParticipants.map((participant, index) => {
                          const score = participant.totalScore || participant.marksObtained || 0;
                          const totalMarks = participant.exam?.totalMarks || 100;
                          const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
                          
                          return (
                          <tr key={participant.id} style={{
                            background: !participant.gaveExam ? '#fef2f2' : participant.status === 'submitted' ? '#f0fdf4' : '#fff'
                          }}>
                            <td>{index + 1}</td>
                            <td>{participant.student?.fullName || 'Unknown'}</td>
                            <td>{participant.student?.email || 'N/A'}</td>
                            <td>
                              <span style={{
                                fontWeight: 'bold',
                                color: !participant.gaveExam ? '#991b1b' : percentage >= 60 ? '#059669' : '#dc2626'
                              }}>
                                {!participant.gaveExam ? '❌ Not Attempted' : 
                                 participant.status === 'submitted' ? `${score} / ${totalMarks} (${percentage.toFixed(1)}%)` : 
                                 'In Progress'}
                              </span>
                            </td>
                            <td>
                              {!participant.gaveExam ? (
                                <span className="badge" style={{background: '#dc2626', color: 'white'}}>❌ Absent</span>
                              ) : participant.status === 'submitted' ? (
                                <span className="badge badge-success">✓ Submitted</span>
                              ) : (
                                <span className="badge badge-warning">⏳ Joined</span>
                              )}
                            </td>
                            <td>{participant.joinedAt ? new Date(participant.joinedAt).toLocaleString() : '-'}</td>
                            <td>{participant.submittedAt ? new Date(participant.submittedAt).toLocaleString() : '-'}</td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Messages */}
          {activeView === 'messages' && (
            <div className="form-card">
              <h2>💬 Send Message / Notification</h2>
              <p className="subtitle">Send important announcements to students and teachers</p>
              
              <form onSubmit={handleSendMessage} className="message-form">
                <div className="form-group">
                  <label>Send To *</label>
                  <select
                    value={messageForm.recipientRole}
                    onChange={(e) => setMessageForm({...messageForm, recipientRole: e.target.value})}
                    required
                  >
                    <option value="student">All Students</option>
                    <option value="teacher">All Teachers</option>
                    <option value="all">Everyone (Students & Teachers)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Subject *</label>
                  <input
                    type="text"
                    value={messageForm.subject}
                    onChange={(e) => setMessageForm({...messageForm, subject: e.target.value})}
                    placeholder="e.g., Important Announcement"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Message *</label>
                  <textarea
                    value={messageForm.message}
                    onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
                    placeholder="Type your message or notification here..."
                    rows="8"
                    required
                  />
                </div>

                <button type="submit" className="btn-primary btn-large">
                  📤 Send Message to All
                </button>
              </form>
            </div>
          )}

          {/* Teacher Access Keys Management */}
          {activeView === 'access-keys' && (
            <>
              <div className="form-card">
                <h2>🔑 Create Teacher Access Key</h2>
                <p className="subtitle">Generate 8-digit access ID for teacher registration. Teachers can only sign up with a valid access key.</p>
                
                <form onSubmit={handleCreateAccessKey} className="access-key-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Teacher Name *</label>
                      <input
                        type="text"
                        value={accessKeyForm.teacherName}
                        onChange={(e) => setAccessKeyForm({...accessKeyForm, teacherName: e.target.value})}
                        placeholder="e.g., Dr. John Smith"
                        required
                      />
                      <small style={{color: '#64748b', marginTop: '4px'}}>
                        Teacher must use this exact name during signup
                      </small>
                    </div>
                    <div className="form-group">
                      <label>Email (Optional)</label>
                      <input
                        type="email"
                        value={accessKeyForm.email}
                        onChange={(e) => setAccessKeyForm({...accessKeyForm, email: e.target.value})}
                        placeholder="teacher@example.com"
                      />
                      <small style={{color: '#64748b', marginTop: '4px'}}>
                        For reference only
                      </small>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary btn-large">
                    ✅ Generate Access Key
                  </button>
                </form>
              </div>

              {/* Access Keys List */}
              <div className="data-table-container">
                <div className="table-header">
                  <h2>🔑 Teacher Access Keys</h2>
                  <div style={{display: 'flex', gap: '16px', marginTop: '8px'}}>
                    <p style={{margin: 0}}>Total: {accessKeys.length}</p>
                    <p style={{margin: 0, color: '#10b981'}}>Available: {accessKeys.filter(k => !k.isUsed).length}</p>
                    <p style={{margin: 0, color: '#64748b'}}>Used: {accessKeys.filter(k => k.isUsed).length}</p>
                  </div>
                </div>
                
                {accessKeys.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">🔑</span>
                    <p>No access keys created yet</p>
                    <small>Create access keys above to allow teachers to register</small>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Access ID</th>
                          <th>Teacher Name</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th>Used By</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accessKeys.map(key => (
                          <tr key={key.id}>
                            <td>
                              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <strong style={{fontFamily: 'monospace', fontSize: '16px'}}>
                                  {key.accessId}
                                </strong>
                                <button
                                  onClick={() => handleCopyAccessId(key.accessId)}
                                  style={{
                                    padding: '4px 8px',
                                    background: '#f1f5f9',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                  title="Copy Access ID"
                                >
                                  📋
                                </button>
                              </div>
                            </td>
                            <td><strong>{key.teacherName}</strong></td>
                            <td>{key.email || 'N/A'}</td>
                            <td>
                              {key.isUsed ? (
                                <span className="badge" style={{background: '#fee2e2', color: '#991b1b'}}>
                                  Used
                                </span>
                              ) : (
                                <span className="badge" style={{background: '#dcfce7', color: '#166534'}}>
                                  Available
                                </span>
                              )}
                            </td>
                            <td>
                              {key.isUsed ? (
                                <div>
                                  <small>{key.teacher?.facultyName || 'N/A'}</small>
                                  <br />
                                  <small style={{color: '#94a3b8'}}>
                                    {key.usedAt ? new Date(key.usedAt).toLocaleDateString() : ''}
                                  </small>
                                </div>
                              ) : (
                                <small style={{color: '#94a3b8'}}>Not used</small>
                              )}
                            </td>
                            <td>{new Date(key.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div style={{display: 'flex', gap: '8px'}}>
                                {!key.isUsed && (
                                  <>
                                    <button
                                      onClick={() => handleRegenerateAccessId(key.id)}
                                      style={{
                                        padding: '6px 12px',
                                        background: '#fef3c7',
                                        border: 'none',
                                        borderRadius: '6px',
                                        color: '#92400e',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '600'
                                      }}
                                      title="Generate new ID"
                                    >
                                      🔄
                                    </button>
                                    <button 
                                      className="btn-delete"
                                      onClick={() => handleDeleteAccessKey(key.id, key.isUsed)}
                                      style={{padding: '6px 12px', fontSize: '13px'}}
                                    >
                                      🗑️
                                    </button>
                                  </>
                                )}
                                {key.isUsed && (
                                  <span style={{color: '#94a3b8', fontSize: '13px'}}>
                                    No actions
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Instructions Card */}
              <div className="form-card" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white'}}>
                <h2 style={{color: 'white'}}>ℹ️ How Teacher Access Keys Work</h2>
                <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px'}}>
                  <p style={{margin: 0, display: 'flex', alignItems: 'start', gap: '12px'}}>
                    <span style={{fontSize: '20px'}}>1️⃣</span>
                    <span>Admin creates an access key with the teacher's name</span>
                  </p>
                  <p style={{margin: 0, display: 'flex', alignItems: 'start', gap: '12px'}}>
                    <span style={{fontSize: '20px'}}>2️⃣</span>
                    <span>System generates a unique 8-digit access ID</span>
                  </p>
                  <p style={{margin: 0, display: 'flex', alignItems: 'start', gap: '12px'}}>
                    <span style={{fontSize: '20px'}}>3️⃣</span>
                    <span>Admin shares the access ID and teacher name with the teacher</span>
                  </p>
                  <p style={{margin: 0, display: 'flex', alignItems: 'start', gap: '12px'}}>
                    <span style={{fontSize: '20px'}}>4️⃣</span>
                    <span>Teacher uses the 8-digit ID as "Teacher ID" and exact name during signup</span>
                  </p>
                  <p style={{margin: 0, display: 'flex', alignItems: 'start', gap: '12px'}}>
                    <span style={{fontSize: '20px'}}>5️⃣</span>
                    <span>After successful signup, the access key is marked as "Used"</span>
                  </p>
                </div>
                <div style={{marginTop: '20px', padding: '16px', background: 'rgba(255,255,255,0.1)', borderRadius: '8px'}}>
                  <strong>⚠️ Important:</strong> Each access key can only be used once. Teachers must use the exact name provided to successfully register.
                </div>
              </div>
            </>
          )}

          {/* Fee Management */}
          {activeView === 'fee-management' && (
            <AdminFeeManagement />
          )}

          {/* Student Access Keys */}
          {activeView === 'student-keys' && (
            <div className="data-table-container">
              <div className="table-header">
                <h2>🎓 Student Access Keys Management</h2>
                <p>Generate and manage student access keys for signup</p>
              </div>

              {/* Generate Access Key Form */}
              <div className="form-card">
                <h3>🔑 Generate New Student Access Key</h3>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const response = await userService.createStudentWithKey(studentKeyForm);
                    setSuccessMessage(`✅ Access Key Generated: ${response.data.accessKey}`);
                    setStudentKeyForm({ fullName: '', email: '', batchYear: '2024-2025', semester: 'Semester 7' });
                    loadData();
                    setTimeout(() => setSuccessMessage(''), 5000);
                  } catch (err) {
                    setError(err.response?.data?.message || 'Failed to generate access key');
                  }
                }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Student Full Name *</label>
                      <input
                        type="text"
                        value={studentKeyForm.fullName}
                        onChange={(e) => setStudentKeyForm({ ...studentKeyForm, fullName: e.target.value })}
                        placeholder="Enter student's full name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Student Email *</label>
                      <input
                        type="email"
                        value={studentKeyForm.email}
                        onChange={(e) => setStudentKeyForm({ ...studentKeyForm, email: e.target.value })}
                        placeholder="Enter student's email"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Batch Year *</label>
                      <input
                        type="text"
                        value={studentKeyForm.batchYear}
                        onChange={(e) => setStudentKeyForm({ ...studentKeyForm, batchYear: e.target.value })}
                        placeholder="e.g., 2024-2025"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Semester *</label>
                      <select
                        value={studentKeyForm.semester}
                        onChange={(e) => setStudentKeyForm({ ...studentKeyForm, semester: e.target.value })}
                        required
                      >
                        <option value="">Select Semester</option>
                        {[1,2,3,4,5,6,7,8].map(sem => (
                          <option key={sem} value={`Semester ${sem}`}>Semester {sem}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <button type="submit" className="btn-generate-key">
                    🔑 Generate 7-Digit Access Key
                  </button>
                </form>
              </div>
              
              <div className="table-responsive">
                <h3>📋 All Student Access Keys</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Access Key</th>
                      <th>Contact</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                          <p style={{ color: '#64748b', fontSize: '16px' }}>
                            No students yet. Generate an access key above to create the first student.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      students.map(student => (
                        <tr key={student.id}>
                          <td>{student.studentId || 'N/A'}</td>
                          <td>{student.fullName || 'Not Set'}</td>
                          <td>{student.email || 'Not Set'}</td>
                          <td>
                            {student.accessKey ? (
                              <span className="access-key-display">
                                <strong>{student.accessKey}</strong>
                                <button 
                                  className="btn-copy"
                                  onClick={() => {
                                    navigator.clipboard.writeText(student.accessKey);
                                    setSuccessMessage('Access key copied!');
                                    setTimeout(() => setSuccessMessage(''), 2000);
                                  }}
                                  title="Copy to clipboard"
                                >
                                  📋
                                </button>
                              </span>
                            ) : (
                              <span className="text-muted">No key</span>
                            )}
                          </td>
                          <td>{student.contactNumber || 'N/A'}</td>
                          <td>
                            {student.email && student.fullName && student.contactNumber ? (
                              <span className="status-badge status-active">Active</span>
                            ) : student.accessKey ? (
                              <span className="status-badge status-pending">Pending Signup</span>
                            ) : (
                              <span className="status-badge status-inactive">No Key</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="info-panel">
                <h3>ℹ️ How Student Access Keys Work:</h3>
                <ol>
                  <li><strong>Generate Key:</strong> Admin creates a 7-digit access key for a student</li>
                  <li><strong>Share Key:</strong> Provide the access key to the student (via email, print, etc.)</li>
                  <li><strong>Student Signup:</strong> Student uses Name + Email + Access Key to activate their account</li>
                  <li><strong>Login:</strong> Student can then login using Name + Email + Access Key</li>
                  <li><strong>Status:</strong> 
                    <ul>
                      <li><span className="status-badge status-inactive">No Key</span> - No access key generated yet</li>
                      <li><span className="status-badge status-pending">Pending</span> - Key generated but student hasn't signed up</li>
                      <li><span className="status-badge status-active">Active</span> - Student has completed signup</li>
                    </ul>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Admins Management */}
          {activeView === 'admins' && (
            <div className="data-table-container">
              <div className="table-header">
                <h2>Admins List</h2>
                <p>Total: {admins.length} / 10 admins</p>
              </div>

              {/* Generate Admin Section - Only for Super Admin */}
              {isSuperAdmin && (
                <div className="generate-admin-section" style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '25px',
                  borderRadius: '15px',
                  marginBottom: '25px',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                }}>
                  <h3 style={{marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <span>🔐</span> Super Admin: Generate New Admin Credentials
                  </h3>
                  <form onSubmit={handleGenerateAdmin} style={{display: 'grid', gap: '15px'}}>
                    <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px'}}>
                      <div>
                        <label style={{display: 'block', marginBottom: '5px', fontWeight: '600'}}>Admin Name</label>
                        <input
                          type="text"
                          value={adminGenerateForm.name}
                          onChange={(e) => setAdminGenerateForm({...adminGenerateForm, name: e.target.value})}
                          required
                          placeholder="Enter admin name"
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{display: 'block', marginBottom: '5px', fontWeight: '600'}}>Email</label>
                        <input
                          type="email"
                          value={adminGenerateForm.email}
                          onChange={(e) => setAdminGenerateForm({...adminGenerateForm, email: e.target.value})}
                          required
                          placeholder="Enter email"
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{display: 'block', marginBottom: '5px', fontWeight: '600'}}>Unique Key (897541)</label>
                        <input
                          type="text"
                          value={adminGenerateForm.uniqueKey}
                          onChange={(e) => setAdminGenerateForm({...adminGenerateForm, uniqueKey: e.target.value})}
                          required
                          placeholder="Enter unique key"
                          maxLength="6"
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: 'none',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn-primary" style={{
                      background: 'white',
                      color: '#667eea',
                      padding: '12px 30px',
                      borderRadius: '10px',
                      border: 'none',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: '15px',
                      transition: 'transform 0.2s'
                    }}>
                      🎯 Generate Admin Credentials
                    </button>
                  </form>

                  {generatedAdminCredentials && (
                    <div style={{
                      marginTop: '20px',
                      padding: '20px',
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <h4 style={{marginBottom: '15px'}}>✅ Admin Generated Successfully!</h4>
                      <div style={{display: 'grid', gap: '10px', fontSize: '14px'}}>
                        <div><strong>Name:</strong> {generatedAdminCredentials.name}</div>
                        <div><strong>Admin Code:</strong> <span style={{fontSize: '18px', fontWeight: 'bold'}}>{generatedAdminCredentials.adminCode}</span></div>
                        <div><strong>Email:</strong> {generatedAdminCredentials.email}</div>
                        <div><strong>Temporary Password:</strong> <span style={{fontSize: '16px', fontWeight: 'bold', background: 'rgba(255,255,255,0.3)', padding: '5px 10px', borderRadius: '5px'}}>{generatedAdminCredentials.temporaryPassword}</span></div>
                      </div>
                      <p style={{marginTop: '10px', fontSize: '13px', opacity: '0.9'}}>⚠️ Save these credentials! They won't be shown again.</p>
                      <button 
                        onClick={() => setGeneratedAdminCredentials(null)}
                        style={{
                          marginTop: '15px',
                          background: 'rgba(255,255,255,0.3)',
                          color: 'white',
                          padding: '8px 20px',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        Close
                      </button>
                    </div>
                  )}

                  {generatedAdmins.length > 0 && (
                    <div style={{marginTop: '20px'}}>
                      <h4 style={{marginBottom: '10px'}}>📋 Your Generated Admins ({generatedAdmins.length})</h4>
                      <div style={{display: 'grid', gap: '10px'}}>
                        {generatedAdmins.map(admin => (
                          <div key={admin.id} style={{
                            background: 'rgba(255,255,255,0.15)',
                            padding: '12px',
                            borderRadius: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{fontSize: '14px'}}>
                              <strong>{admin.name}</strong> - Code: <strong>{admin.adminCode}</strong>
                              <div style={{fontSize: '12px', opacity: '0.9'}}>{admin.email}</div>
                            </div>
                            <div style={{fontSize: '12px', opacity: '0.8'}}>
                              {new Date(admin.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Admin Code</th>
                      <th>Name</th>
                      <th>Joined</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map(admin => (
                      <tr key={admin.id}>
                        <td>{admin.id}</td>
                        <td><strong>{admin.adminCode}</strong></td>
                        <td>{admin.name}</td>
                        <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                        <td>
                          {admin.id !== user?.id && (
                            <button 
                              className="btn-delete"
                              onClick={() => handleDeleteUser('admin', admin.id)}
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Settings View */}
          {activeView === 'settings' && (
            <div className="settings-container">
              <div className="settings-section">
                <h2>🎨 Theme Settings</h2>
                <p className="section-description">Choose your preferred theme for the dashboard</p>
                
                <div className="theme-options">
                  <div 
                    className={`theme-card ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('light')}
                  >
                    <div className="theme-icon">☀️</div>
                    <h3>Light Mode</h3>
                    <p>Classic bright theme</p>
                    {theme === 'light' && <span className="active-badge">✓ Active</span>}
                  </div>

                  <div 
                    className={`theme-card ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <div className="theme-icon">🌙</div>
                    <h3>Dark Mode</h3>
                    <p>Easy on the eyes</p>
                    {theme === 'dark' && <span className="active-badge">✓ Active</span>}
                  </div>

                  <div 
                    className={`theme-card ${theme === 'eye-protection' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('eye-protection')}
                  >
                    <div className="theme-icon">👁️</div>
                    <h3>Eye Protection</h3>
                    <p>Reduced blue light</p>
                    {theme === 'eye-protection' && <span className="active-badge">✓ Active</span>}
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h2>👤 Account Settings</h2>
                <p className="section-description">Manage your admin account</p>
                
                <div className="account-info">
                  <div className="info-row">
                    <span className="info-label">Admin Code:</span>
                    <span className="info-value">{user?.adminCode}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{user?.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Role:</span>
                    <span className="info-value">Administrator</span>
                  </div>
                </div>

                <button className="logout-btn-settings" onClick={logout}>
                  <span>🚪</span> Logout from Account
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
