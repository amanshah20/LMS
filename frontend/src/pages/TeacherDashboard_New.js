import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { liveClassService, messageService, onlineExamService, courseService } from '../services/api';
import axios from 'axios';
import TeacherProfile from '../components/TeacherProfile';
import './Dashboard_New.css';
import './TeacherDashboard.css';
import './StatusMessages.css';

const TeacherDashboard_New = () => {
  const { user, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Dashboard data
  const [students, setStudents] = useState([]);
  const [myExams, setMyExams] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  
  // Attendance
  const [selectedClassForAttendance, setSelectedClassForAttendance] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);
  const [selectedStudentForAttendance, setSelectedStudentForAttendance] = useState(null);
  const [studentAttendanceReport, setStudentAttendanceReport] = useState([]);
  
  // Exam Management
  const [selectedExam, setSelectedExam] = useState(null);
  const [examParticipants, setExamParticipants] = useState([]);
  
  // Assignments
  const [assignments, setAssignments] = useState([]);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxMarks: 100
  });
  const [assignmentFile, setAssignmentFile] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
  
  // Quizzes
  const [quizzes, setQuizzes] = useState([]);
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    duration: 30,
    totalMarks: 100,
    questions: []
  });
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    marks: 1
  });
  
  // Communication
  const [messages, setMessages] = useState([]);
  const [messageForm, setMessageForm] = useState({
    recipientType: 'student', // student or parent
    recipientId: '',
    subject: '',
    message: ''
  });
  const [feedbacks, setFeedbacks] = useState([]);
  
  // Student Feedback
  const [myGivenFeedback, setMyGivenFeedback] = useState([]);
  const [feedbackForm, setFeedbackForm] = useState({
    studentId: '',
    subject: '',
    message: '',
    type: 'general',
    rating: 3
  });
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(null);
  
  // Batch/Section Management
  const [mySections, setMySections] = useState([]);
  const [sectionForm, setSectionForm] = useState({
    sectionName: '',
    batchYear: '',
    semester: '',
    subject: '',
    description: ''
  });
  const [selectedSection, setSelectedSection] = useState(null);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudentsToAdd, setSelectedStudentsToAdd] = useState([]);
  
  // Offline Classes/Timetable
  const [offlineClasses, setOfflineClasses] = useState([]);
  const [offlineClassForm, setOfflineClassForm] = useState({
    sectionId: '',
    subject: '',
    dayOfWeek: 'Monday',
    startTime: '',
    endTime: '',
    roomNumber: '',
    classType: 'lecture',
    notes: ''
  });
  const [editingOfflineClass, setEditingOfflineClass] = useState(null);
  
  // Announcements
  const [announcements, setAnnouncements] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    priority: 'normal',
    targetAudience: 'all'
  });
  
  // Notifications
  const [notifications, setNotifications] = useState([]);
  
  // Profile
  const [showProfile, setShowProfile] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState(user);
  
  // Settings
  const [theme, setTheme] = useState(localStorage.getItem('teacherTheme') || 'light');
  
  // Loading & Messages
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
      loadNotifications();
      loadAssignments();
      loadAnnouncements();
    }
  }, [user]);

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('teacherTheme', theme);
  }, [theme]);

  useEffect(() => {
    if (activeMenu === 'give-feedback') {
      loadMyGivenFeedback();
      if (students.length === 0) {
        loadStudents();
      }
    }
  }, [activeMenu]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStudents(),
        loadMyExams(),
        loadMyClasses(),
        loadCourses()
      ]);
      setLoading(false);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      // Placeholder - implement backend endpoint
      setNotifications([
        { id: 1, type: 'assignment', message: 'New assignment submission from John Doe', time: new Date(), read: false },
        { id: 2, type: 'exam', message: 'Quiz results published successfully', time: new Date(), read: true }
      ]);
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  };

  const loadAssignments = async () => {
    try {
      // Placeholder - implement backend endpoint
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/assignments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error('Error loading assignments:', err);
      setAssignments([]); // Demo data
    }
  };

  const loadAnnouncements = async () => {
    try {
      // Placeholder - implement backend endpoint
      setAnnouncements([
        { id: 1, title: 'Midterm Exams Schedule', content: 'Exams will start from next week...', priority: 'high', createdAt: new Date() }
      ]);
    } catch (err) {
      console.error('Error loading announcements:', err);
    }
  };

  const loadMyGivenFeedback = async () => {
    setFeedbackLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/feedback/my-given-feedback', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('📝 Loaded given feedback:', res.data.feedback?.length || 0);
      if (res.data.success) {
        setMyGivenFeedback(res.data.feedback || []);
      }
    } catch (err) {
      console.error('❌ Error loading given feedback:', err);
      showError('Failed to load feedback history');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackForm.studentId) {
      showError('Please select a student');
      return;
    }
    if (!feedbackForm.message.trim()) {
      showError('Please enter feedback message');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingFeedback 
        ? `http://localhost:5000/api/feedback/${editingFeedback.id}`
        : 'http://localhost:5000/api/feedback/create';
      
      const method = editingFeedback ? 'put' : 'post';
      const res = await axios[method](url, feedbackForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        showSuccess(editingFeedback ? 'Feedback updated successfully!' : 'Feedback sent successfully!');
        setFeedbackForm({
          studentId: '',
          subject: '',
          message: '',
          type: 'general',
          rating: 3
        });
        setEditingFeedback(null);
        loadMyGivenFeedback();
      }
    } catch (err) {
      console.error('❌ Error submitting feedback:', err);
      showError(err.response?.data?.message || 'Failed to submit feedback');
    }
  };

  const handleEditFeedback = (feedback) => {
    setEditingFeedback(feedback);
    setFeedbackForm({
      studentId: feedback.studentId,
      subject: feedback.subject || '',
      message: feedback.message,
      type: feedback.type,
      rating: feedback.rating || 3
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(`http://localhost:5000/api/feedback/${feedbackId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        showSuccess('Feedback deleted successfully!');
        loadMyGivenFeedback();
      }
    } catch (err) {
      console.error('❌ Error deleting feedback:', err);
      showError('Failed to delete feedback');
    }
  };

  const loadMySections = async () => {
    try {
      setSectionsLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/sections/my-sections', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        console.log('📚 Loaded', response.data.sections.length, 'sections');
        setMySections(response.data.sections);
      }
      setSectionsLoading(false);
    } catch (err) {
      console.error('❌ Error loading sections:', err);
      showError('Failed to load sections');
      setSectionsLoading(false);
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!sectionForm.sectionName || !sectionForm.batchYear || !sectionForm.semester || !sectionForm.subject) {
      showError('Please fill all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/sections/create', sectionForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        showSuccess('Section created successfully! You can now add students.');
        setSectionForm({ sectionName: '', batchYear: '', semester: '', subject: '', description: '' });
        loadMySections();
      }
    } catch (err) {
      console.error('❌ Error creating section:', err);
      showError(err.response?.data?.message || 'Failed to create section');
    }
  };

  const handleAddStudentToSection = async (sectionId, studentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/sections/${sectionId}/add-student`,
        { studentId },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      if (response.data.success) {
        showSuccess('Student added to section!');
        loadMySections();
      }
    } catch (err) {
      console.error('❌ Error adding student:', err);
      showError(err.response?.data?.message || 'Failed to add student');
    }
  };

  const handleRemoveStudentFromSection = async (sectionId, studentId) => {
    if (!window.confirm('Remove this student from the section?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `http://localhost:5000/api/sections/${sectionId}/remove-student/${studentId}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );

      if (response.data.success) {
        showSuccess('Student removed from section');
        loadMySections();
      }
    } catch (err) {
      console.error('❌ Error removing student:', err);
      showError('Failed to remove student');
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm('Delete this section? All enrolled students will be removed.')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `http://localhost:5000/api/sections/${sectionId}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );

      if (response.data.success) {
        showSuccess('Section deleted successfully');
        loadMySections();
      }
    } catch (err) {
      console.error('❌ Error deleting section:', err);
      showError('Failed to delete section');
    }
  };

  const loadMyOfflineClasses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/offline-classes/my-classes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        console.log('📅 Loaded', response.data.offlineClasses.length, 'offline classes');
        setOfflineClasses(response.data.offlineClasses);
      }
    } catch (err) {
      console.error('❌ Error loading offline classes:', err);
      showError('Failed to load offline classes');
    }
  };

  const handleCreateOfflineClass = async (e) => {
    e.preventDefault();
    if (!offlineClassForm.sectionId || !offlineClassForm.subject || !offlineClassForm.startTime || !offlineClassForm.endTime) {
      showError('Please fill all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingOfflineClass 
        ? `http://localhost:5000/api/offline-classes/${editingOfflineClass.id}`
        : 'http://localhost:5000/api/offline-classes/create';
      
      const method = editingOfflineClass ? 'put' : 'post';
      const response = await axios[method](url, offlineClassForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        showSuccess(editingOfflineClass ? 'Class updated!' : 'Offline class scheduled!');
        setOfflineClassForm({
          sectionId: '',
          subject: '',
          dayOfWeek: 'Monday',
          startTime: '',
          endTime: '',
          roomNumber: '',
          classType: 'lecture',
          notes: ''
        });
        setEditingOfflineClass(null);
        loadMyOfflineClasses();
      }
    } catch (err) {
      console.error('❌ Error creating offline class:', err);
      showError(err.response?.data?.message || 'Failed to schedule class');
    }
  };

  const handleDeleteOfflineClass = async (classId) => {
    if (!window.confirm('Delete this scheduled class?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(
        `http://localhost:5000/api/offline-classes/${classId}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );

      if (response.data.success) {
        showSuccess('Class deleted successfully');
        loadMyOfflineClasses();
      }
    } catch (err) {
      console.error('❌ Error deleting class:', err);
      showError('Failed to delete class');
    }
  };

  const loadStudents = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users/students', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      console.log('Students loaded:', res.data.students?.length || 0);
      setStudents(res.data.students || []);
    } catch (err) {
      console.error('Error loading students:', err);
      console.error('Error details:', err.response?.data);
      showError('Failed to load students list');
    }
  };

  const loadMyExams = async () => {
    try {
      const res = await onlineExamService.getAllExams();
      // Filter exams assigned to this teacher
      const teacherExams = res.data.exams.filter(exam => exam.teacherId === user.id);
      setMyExams(teacherExams);
    } catch (err) {
      console.error('Error loading exams:', err);
    }
  };

  const loadMyClasses = async () => {
    try {
      const res = await liveClassService.getTeacherClasses(user.id);
      setMyClasses(res.data.liveClasses || []);
    } catch (err) {
      console.error('Error loading classes:', err);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await courseService.getAllCourses();
      setCourses(res.data.courses || []);
    } catch (err) {
      console.error('Error loading courses:', err);
    }
  };

  const loadAttendance = async (classId) => {
    try {
      const res = await liveClassService.getAttendance(classId);
      setAttendanceList(res.data.attendance || []);
      setSelectedClassForAttendance(classId);
    } catch (err) {
      showError('Failed to load attendance');
    }
  };

  const loadIndividualAttendance = async (studentId) => {
    try {
      // Placeholder - implement backend endpoint
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/attendance/student/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudentAttendanceReport(res.data.attendance || []);
      setSelectedStudentForAttendance(studentId);
    } catch (err) {
      console.error('Error loading individual attendance:', err);
      // Demo data
      setStudentAttendanceReport([
        { classId: 1, className: 'Math 101', date: '2024-01-15', status: 'present' },
        { classId: 2, className: 'Math 101', date: '2024-01-16', status: 'absent' }
      ]);
      setSelectedStudentForAttendance(studentId);
    }
  };

  const handleMarkAttendance = async (classId, studentEmail, status) => {
    try {
      await liveClassService.markAttendance(classId, studentEmail, status);
      showSuccess('Attendance marked successfully');
      loadAttendance(classId);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const handleStartExam = async (examId) => {
    try {
      await onlineExamService.unlockExam(examId);
      showSuccess('✅ Exam started! Students can now access and take the exam.');
      loadMyExams();
    } catch (err) {
      showError('Failed to start exam');
    }
  };

  const handleViewExamResults = async (examId) => {
    try {
      const res = await onlineExamService.getParticipants(examId);
      const participants = res.data.participants || [];
      const exam = res.data.exam;
      
      // Add exam details to each participant
      const participantsWithExam = participants.map(p => ({
        ...p,
        exam: exam,
        totalMarks: exam?.totalMarks || 100
      }));
      
      setExamParticipants(participantsWithExam);
      setSelectedExam(exam);
      setActiveMenu('exam-results');
    } catch (err) {
      showError('Failed to load exam results');
    }
  };

  const handlePublishResults = async (examId) => {
    if (!window.confirm('Publish exam results to all students? They will receive notifications and can view their scores.')) {
      return;
    }
    
    try {
      const response = await onlineExamService.publishResults(examId);
      showSuccess(response.data.message || 'Results published successfully! Students have been notified.');
      
      // Reload exam participants to show updated status
      if (selectedExam) {
        handleViewExamResults(examId);
      }
    } catch (err) {
      console.error('Failed to publish results:', err);
      showError(err.response?.data?.message || 'Failed to publish results');
    }
  };

  // Assignment Handlers
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    
    if (!assignmentFile) {
      showError('Please upload an assignment PDF file');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', assignmentForm.title);
      formData.append('description', assignmentForm.description);
      formData.append('dueDate', assignmentForm.dueDate);
      formData.append('maxMarks', assignmentForm.maxMarks);
      formData.append('teacherId', user.id);
      formData.append('teacherName', user.facultyName);
      formData.append('assignmentFile', assignmentFile);

      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/assignments', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      showSuccess('Assignment created and sent to all students!');
      setAssignmentForm({
        title: '',
        description: '',
        dueDate: '',
        maxMarks: 100
      });
      setAssignmentFile(null);
      document.getElementById('assignmentFileInput').value = '';
      loadAssignments();
    } catch (err) {
      console.error('Error creating assignment:', err);
      showError(err.response?.data?.message || 'Failed to create assignment');
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/assignments/${assignmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSuccess('Assignment deleted successfully!');
      loadAssignments();
    } catch (err) {
      showError('Failed to delete assignment');
    }
  };

  const handleGradeSubmission = async (submissionId, marks, feedback) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/assignments/submissions/${submissionId}/grade`, {
        marks,
        feedback
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSuccess('Grade submitted successfully!');
      // Reload submissions
      if (selectedAssignment) {
        loadAssignmentSubmissions(selectedAssignment.id);
      }
    } catch (err) {
      showError('Failed to grade submission');
    }
  };

  const loadAssignmentSubmissions = async (assignmentId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/assignments/${assignmentId}/submissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignmentSubmissions(res.data.submissions || []);
      setSelectedAssignment(assignments.find(a => a.id === assignmentId));
      setActiveMenu('grade-assignments');
    } catch (err) {
      console.error('Error loading submissions:', err);
      // Demo data
      setAssignmentSubmissions([
        { id: 1, studentName: 'John Doe', submittedAt: new Date(), status: 'submitted', marks: null }
      ]);
      setSelectedAssignment(assignments.find(a => a.id === assignmentId));
      setActiveMenu('grade-assignments');
    }
  };

  // Quiz Handlers
  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    
    if (quizForm.questions.length === 0) {
      showError('Please add at least one question to the quiz');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Create quiz as an online exam with createdByRole = 'teacher'
      const examData = {
        examTitle: quizForm.title,
        examDescription: quizForm.description || 'Quiz',
        examDate: new Date().toISOString(),
        duration: parseInt(quizForm.duration),
        totalMarks: parseInt(quizForm.totalMarks),
        teacherId: user.id,
        createdBy: user.id,
        createdByRole: 'teacher',
        isLocked: false, // Quizzes are immediately available
        questions: quizForm.questions.map((q, index) => ({
          questionText: q.question,
          optionA: q.options[0],
          optionB: q.options[1],
          optionC: q.options[2],
          optionD: q.options[3],
          correctAnswer: ['A', 'B', 'C', 'D'][q.correctAnswer],
          marks: parseInt(q.marks),
          questionOrder: index + 1
        }))
      };

      const response = await axios.post('http://localhost:5000/api/online-exams/create', examData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      showSuccess('✅ Quiz created and available to students immediately!');
      setQuizForm({
        title: '',
        description: '',
        duration: 30,
        totalMarks: 100,
        questions: []
      });
      setCurrentQuestion({
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        marks: 1
      });
      loadMyExams(); // Reload to show the new quiz
    } catch (err) {
      console.error('Error creating quiz:', err);
      showError(err.response?.data?.message || 'Failed to create quiz');
    }
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.question || currentQuestion.options.some(opt => !opt)) {
      showError('Please fill all question fields');
      return;
    }
    setQuizForm(prev => ({
      ...prev,
      questions: [...prev.questions, currentQuestion]
    }));
    setCurrentQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      marks: 1
    });
    showSuccess('Question added!');
  };

  // Communication Handlers
  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/messages', {
        ...messageForm,
        senderId: user.id,
        senderType: 'teacher'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSuccess('Message sent successfully!');
      setMessageForm({
        recipientType: 'student',
        recipientId: '',
        subject: '',
        message: ''
      });
    } catch (err) {
      showError('Failed to send message');
    }
  };

  const handleSendFeedback = async (studentId, feedback, category) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/feedback', {
        studentId,
        teacherId: user.id,
        feedback,
        category
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSuccess('Feedback sent to student!');
    } catch (err) {
      showError('Failed to send feedback');
    }
  };

  // Announcement Handlers
  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/announcements', {
        ...announcementForm,
        teacherId: user.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showSuccess('Announcement posted successfully!');
      setAnnouncementForm({
        title: '',
        content: '',
        priority: 'normal',
        targetAudience: 'all'
      });
      loadAnnouncements();
    } catch (err) {
      showError('Failed to post announcement');
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const markNotificationRead = async (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const showError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Profile Modal */}
      {showProfile && (
        <TeacherProfile
          user={teacherProfile}
          onClose={() => setShowProfile(false)}
          onUpdate={(updatedData) => {
            setTeacherProfile(updatedData);
            showSuccess('Profile updated successfully!');
          }}
        />
      )}

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="status-message success-message">
          ✅ {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="status-message error-message">
          ❌ {errorMessage}
        </div>
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>{sidebarCollapsed ? 'T' : 'Teacher Portal'}</h2>
          <button 
            className="collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '☰' : '✕'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeMenu === 'profile' ? 'active' : ''}`}
            onClick={() => setShowProfile(true)}
          >
            <span className="nav-icon">👤</span>
            {!sidebarCollapsed && <span>My Profile</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveMenu('notifications')}
          >
            <span className="nav-icon">🔔</span>
            {!sidebarCollapsed && <span>Notifications</span>}
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="notification-badge">{notifications.filter(n => !n.read).length}</span>
            )}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveMenu('dashboard')}
          >
            <span className="nav-icon">📊</span>
            {!sidebarCollapsed && <span>Dashboard</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'students' ? 'active' : ''}`}
            onClick={() => setActiveMenu('students')}
          >
            <span className="nav-icon">👥</span>
            {!sidebarCollapsed && <span>All Students</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveMenu('attendance')}
          >
            <span className="nav-icon">📝</span>
            {!sidebarCollapsed && <span>Mark Attendance</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'attendance-reports' ? 'active' : ''}`}
            onClick={() => setActiveMenu('attendance-reports')}
          >
            <span className="nav-icon">📈</span>
            {!sidebarCollapsed && <span>Attendance Reports</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveMenu('assignments')}
          >
            <span className="nav-icon">📄</span>
            {!sidebarCollapsed && <span>Assignments</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'grading' ? 'active' : ''}`}
            onClick={() => setActiveMenu('grading')}
          >
            <span className="nav-icon">✍️</span>
            {!sidebarCollapsed && <span>Grading</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'quizzes' ? 'active' : ''}`}
            onClick={() => setActiveMenu('quizzes')}
          >
            <span className="nav-icon">📝</span>
            {!sidebarCollapsed && <span>Quizzes</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'examinations' ? 'active' : ''}`}
            onClick={() => setActiveMenu('examinations')}
          >
            <span className="nav-icon">📋</span>
            {!sidebarCollapsed && <span>Examinations</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveMenu('reports')}
          >
            <span className="nav-icon">📊</span>
            {!sidebarCollapsed && <span>Reports</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'communication' ? 'active' : ''}`}
            onClick={() => setActiveMenu('communication')}
          >
            <span className="nav-icon">💬</span>
            {!sidebarCollapsed && <span>Communication</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'announcements' ? 'active' : ''}`}
            onClick={() => setActiveMenu('announcements')}
          >
            <span className="nav-icon">📢</span>
            {!sidebarCollapsed && <span>Announcements</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'classes' ? 'active' : ''}`}
            onClick={() => setActiveMenu('classes')}
          >
            <span className="nav-icon">🎥</span>
            {!sidebarCollapsed && <span>Live Classes</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveMenu('courses')}
          >
            <span className="nav-icon">📚</span>
            {!sidebarCollapsed && <span>Courses</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'give-feedback' ? 'active' : ''}`}
            onClick={() => setActiveMenu('give-feedback')}
          >
            <span className="nav-icon">📝</span>
            {!sidebarCollapsed && <span>Give Feedback</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'batch-management' ? 'active' : ''}`}
            onClick={() => { setActiveMenu('batch-management'); loadMySections(); loadStudents(); }}
          >
            <span className="nav-icon">👥</span>
            {!sidebarCollapsed && <span>Batch Management</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'timetable-management' ? 'active' : ''}`}
            onClick={() => { setActiveMenu('timetable-management'); loadMyOfflineClasses(); loadMySections(); }}
          >
            <span className="nav-icon">📅</span>
            {!sidebarCollapsed && <span>Timetable</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          <button 
            className={`nav-item ${activeMenu === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveMenu('settings')}
          >
            <span className="nav-icon">⚙️</span>
            {!sidebarCollapsed && <span>Settings</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="top-bar">
          <h1>Welcome, {user?.facultyName || 'Teacher'}</h1>
          <div className="user-info">
            <span>ID: {user?.teacherId}</span>
          </div>
        </div>

        <div className="content-area">
          {/* Dashboard Overview */}
          {activeMenu === 'dashboard' && (
            <div className="dashboard-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>Total Students</h3>
                  <p className="stat-number">{students.length}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-info">
                  <h3>My Exams</h3>
                  <p className="stat-number">{myExams.length}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🎥</div>
                <div className="stat-info">
                  <h3>My Classes</h3>
                  <p className="stat-number">{myClasses.length}</p>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-info">
                  <h3>Total Courses</h3>
                  <p className="stat-number">{courses.length}</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="form-card" style={{gridColumn: '1 / -1'}}>
                <h2>📌 Quick Actions</h2>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '20px'}}>
                  <button className="btn-primary" onClick={() => setActiveMenu('students')}>
                    👥 View All Students
                  </button>
                  <button className="btn-primary" onClick={() => setActiveMenu('attendance')}>
                    📝 Mark Attendance
                  </button>
                  <button className="btn-primary" onClick={() => setActiveMenu('examinations')}>
                    📋 Manage Exams
                  </button>
                  <button className="btn-primary" onClick={() => setActiveMenu('classes')}>
                    🎥 Live Classes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* All Students View */}
          {activeMenu === 'students' && (
            <div className="data-table-container">
              <h2>👥 All Students ({students.length})</h2>
              {students.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">👥</span>
                  <p>No students enrolled yet</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student ID</th>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Contact</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={student.id}>
                        <td>{index + 1}</td>
                        <td>{student.studentId || 'N/A'}</td>
                        <td>{student.fullName}</td>
                        <td>{student.email}</td>
                        <td>{student.contactNumber || 'N/A'}</td>
                        <td>
                          <span className="badge badge-success">Active</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Mark Attendance */}
          {activeMenu === 'attendance' && (
            <div className="form-card">
              <h2>📝 Mark Attendance</h2>
              
              <div className="form-group">
                <label>Select Class</label>
                <select 
                  value={selectedClassForAttendance || ''}
                  onChange={(e) => {
                    setSelectedClassForAttendance(e.target.value);
                    loadAttendance(e.target.value);
                  }}
                >
                  <option value="">Choose a class...</option>
                  {myClasses.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.className} - {new Date(cls.scheduledDate).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              {selectedClassForAttendance && (
                <div className="data-table-container" style={{marginTop: '20px'}}>
                  <h3>Attendance List</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Student Name</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => {
                        const attendance = attendanceList.find(a => a.studentId === student.id);
                        return (
                          <tr key={student.id}>
                            <td>{index + 1}</td>
                            <td>{student.fullName}</td>
                            <td>{student.email}</td>
                            <td>
                              {attendance ? (
                                <span className="badge badge-success">Present</span>
                              ) : (
                                <span className="badge badge-danger">Absent</span>
                              )}
                            </td>
                            <td>
                              {!attendance && (
                                <button
                                  className="btn-secondary"
                                  onClick={() => handleMarkAttendance(selectedClassForAttendance, student.email, 'present')}
                                >
                                  Mark Present
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Examinations */}
          {activeMenu === 'examinations' && (
            <div className="data-table-container">
              <h2>📋 My Examinations ({myExams.length})</h2>
              
              {myExams.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📋</span>
                  <p>No exams assigned to you yet</p>
                  <small>Admin will assign exams to you</small>
                </div>
              ) : (
                <div style={{display: 'grid', gap: '20px'}}>
                  {myExams.map(exam => {
                    const examDate = new Date(exam.examDate);
                    const now = new Date();
                    const isUpcoming = examDate > now;
                    const canStartSoon = (examDate - now) <= 20 * 60 * 1000; // 20 minutes before

                    return (
                      <div key={exam.id} className="form-card" style={{background: exam.isLocked ? '#fee2e2' : '#f0f9ff'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                          <div>
                            <h3 style={{margin: '0 0 10px 0'}}>{exam.examTitle}</h3>
                            <p style={{margin: '5px 0', color: '#64748b'}}>
                              📅 {examDate.toLocaleString()}
                            </p>
                            <p style={{margin: '5px 0', color: '#64748b'}}>
                              ⏱️ Duration: {exam.duration} minutes | 📊 Total Marks: {exam.totalMarks}
                            </p>
                            <p style={{margin: '5px 0', color: '#64748b'}}>
                              📝 Questions: {exam.questions?.length || 0}
                            </p>
                          </div>
                          <div>
                            {exam.isLocked ? (
                              <span style={{
                                background: '#dc2626',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '600'
                              }}>
                                🔒 LOCKED
                              </span>
                            ) : (
                              <span style={{
                                background: '#059669',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '600'
                              }}>
                                🔓 OPEN
                              </span>
                            )}
                          </div>
                        </div>

                        {exam.examDescription && (
                          <p style={{margin: '15px 0', padding: '10px', background: 'rgba(255,255,255,0.5)', borderRadius: '6px'}}>
                            {exam.examDescription}
                          </p>
                        )}

                        <div style={{display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap'}}>
                          {exam.isLocked && isUpcoming && canStartSoon && (
                            <button
                              className="btn-primary"
                              onClick={() => handleStartExam(exam.id)}
                              style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}
                            >
                              ▶️ Start Exam (Make Available to Students)
                            </button>
                          )}
                          
                          {!exam.isLocked && (
                            <div style={{
                              padding: '10px 15px',
                              background: '#dcfce7',
                              color: '#166534',
                              borderRadius: '8px',
                              fontWeight: '600',
                              fontSize: '14px'
                            }}>
                              ✅ Exam is LIVE - Students can access it now
                            </div>
                          )}
                          
                          <button
                            className="btn-secondary"
                            onClick={() => handleViewExamResults(exam.id)}
                          >
                            📊 View Results & Grades
                          </button>
                        </div>

                        {isUpcoming && !canStartSoon && (
                          <p style={{marginTop: '10px', color: '#f59e0b', fontSize: '13px'}}>
                            ⏰ You can unlock the exam hall 20 minutes before the scheduled time
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Exam Results View */}
          {activeMenu === 'exam-results' && selectedExam && (
            <div className="data-table-container">
              <button 
                className="btn-secondary" 
                onClick={() => setActiveMenu('examinations')}
                style={{marginBottom: '20px'}}
              >
                ← Back to Examinations
              </button>

              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <h2>📊 Exam Results & Grading - {selectedExam?.examTitle}</h2>
                {selectedExam?.resultsPublished ? (
                  <div style={{
                    padding: '12px 24px',
                    background: '#dcfce7',
                    color: '#166534',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>
                    ✅ Results Published on {new Date(selectedExam.publishedAt).toLocaleDateString()}
                  </div>
                ) : (
                  <button
                    className="btn-primary"
                    onClick={() => handlePublishResults(selectedExam?.id)}
                    style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}
                  >
                    📢 Publish Results to Students
                  </button>
                )}
              </div>

              {examParticipants.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📊</span>
                  <p>No students have taken this exam yet</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Score</th>
                      <th>Percentage</th>
                      <th>Status</th>
                      <th>Submitted At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examParticipants.map((participant, index) => {
                      const score = participant.totalScore || participant.marksObtained || 0;
                      const totalMarks = participant.totalMarks || participant.exam?.totalMarks || 100;
                      const percentage = totalMarks > 0 ? ((score / totalMarks) * 100).toFixed(1) : 0;
                      
                      return (
                        <tr key={participant.id}>
                          <td>{index + 1}</td>
                          <td>{participant.student?.fullName}</td>
                          <td>{participant.student?.email}</td>
                          <td>
                            <strong>{score}</strong> / {totalMarks}
                          </td>
                          <td>
                            <span className={`badge ${percentage >= 60 ? 'badge-success' : 'badge-danger'}`}>
                              {percentage}%
                            </span>
                          </td>
                          <td>
                            {participant.status === 'submitted' ? (
                              <span className="badge badge-success">✓ Submitted</span>
                            ) : participant.status === 'joined' ? (
                              <span className="badge badge-warning">⏳ In Progress</span>
                            ) : (
                              <span className="badge" style={{background: '#dc2626', color: 'white'}}>Not Attempted</span>
                            )}
                          </td>
                          <td>
                            {participant.submittedAt 
                              ? new Date(participant.submittedAt).toLocaleString()
                              : '-'
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* Summary Statistics */}
              {examParticipants.length > 0 && (
                <div className="form-card" style={{marginTop: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white'}}>
                  <h3 style={{color: 'white'}}>📈 Exam Statistics</h3>
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px'}}>
                    <div>
                      <p style={{margin: 0, fontSize: '14px', opacity: 0.9}}>Total Participants</p>
                      <p style={{margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold'}}>
                        {examParticipants.length}
                      </p>
                    </div>
                    <div>
                      <p style={{margin: 0, fontSize: '14px', opacity: 0.9}}>Submitted</p>
                      <p style={{margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold'}}>
                        {examParticipants.filter(p => p.status === 'submitted').length}
                      </p>
                    </div>
                    <div>
                      <p style={{margin: 0, fontSize: '14px', opacity: 0.9}}>Average Score</p>
                      <p style={{margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold'}}>
                        {examParticipants.filter(p => p.status === 'submitted').length > 0
                          ? (examParticipants
                              .filter(p => p.status === 'submitted')
                              .reduce((sum, p) => sum + (p.totalScore || p.marksObtained || 0), 0) / 
                              examParticipants.filter(p => p.status === 'submitted').length).toFixed(1)
                          : 0
                        }
                      </p>
                    </div>
                    <div>
                      <p style={{margin: 0, fontSize: '14px', opacity: 0.9}}>Pass Rate</p>
                      <p style={{margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold'}}>
                        {examParticipants.filter(p => p.status === 'submitted').length > 0
                          ? ((examParticipants.filter(p => {
                              if (p.status !== 'submitted') return false;
                              const score = p.totalScore || p.marksObtained || 0;
                              const totalMarks = p.totalMarks || p.exam?.totalMarks || 100;
                              const percentage = totalMarks > 0 ? ((score / totalMarks) * 100) : 0;
                              return percentage >= 60;
                            }).length / examParticipants.filter(p => p.status === 'submitted').length) * 100).toFixed(1)
                          : 0
                        }%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Live Classes */}
          {activeMenu === 'classes' && (
            <div className="data-table-container">
              <h2>🎥 My Live Classes ({myClasses.length})</h2>
              {myClasses.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🎥</span>
                  <p>No live classes scheduled</p>
                </div>
              ) : (
                <div style={{display: 'grid', gap: '15px'}}>
                  {myClasses.map(cls => (
                    <div key={cls.id} className="form-card">
                      <h3>{cls.className}</h3>
                      <p style={{color: '#64748b', margin: '10px 0'}}>
                        📅 {new Date(cls.scheduledDate).toLocaleString()}
                      </p>
                      <p style={{color: '#64748b', margin: '10px 0'}}>
                        ⏱️ Duration: {cls.duration} minutes
                      </p>
                      {cls.description && <p>{cls.description}</p>}
                      
                      <div style={{marginTop: '15px'}}>
                        <a 
                          href={cls.meetingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn-primary"
                        >
                          🎥 Join Meeting
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Courses */}
          {activeMenu === 'courses' && (
            <div className="data-table-container">
              <h2>📚 All Courses ({courses.length})</h2>
              {courses.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📚</span>
                  <p>No courses available</p>
                </div>
              ) : (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
                  {courses.map(course => (
                    <div key={course.id} className="form-card">
                      {course.thumbnail && (
                        <img 
                          src={course.thumbnail} 
                          alt={course.title}
                          style={{width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px'}}
                        />
                      )}
                      <h3 style={{marginTop: '15px'}}>{course.title}</h3>
                      <p style={{color: '#64748b', fontSize: '14px'}}>
                        👨‍🏫 {course.instructor}
                      </p>
                      <p style={{color: '#64748b', fontSize: '14px'}}>
                        📹 {course.videos?.length || 0} videos
                      </p>
                      <span className={`badge badge-${course.level === 'beginner' ? 'success' : course.level === 'intermediate' ? 'warning' : 'danger'}`}>
                        {course.level}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notifications */}
          {activeMenu === 'notifications' && (
            <div className="data-table-container">
              <h2>🔔 Notifications</h2>
              {notifications.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🔔</span>
                  <p>No new notifications</p>
                </div>
              ) : (
                <div style={{display: 'grid', gap: '15px'}}>
                  {notifications.map(notif => (
                    <div 
                      key={notif.id} 
                      className="form-card" 
                      style={{
                        background: notif.read ? '#f8f9fa' : '#e3f2fd',
                        borderLeft: notif.read ? '4px solid #dee2e6' : '4px solid #2196f3'
                      }}
                      onClick={() => markNotificationRead(notif.id)}
                    >
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                        <div>
                          <span className={`badge badge-${notif.type === 'assignment' ? 'primary' : notif.type === 'exam' ? 'warning' : 'info'}`}>
                            {notif.type.toUpperCase()}
                          </span>
                          <p style={{margin: '10px 0'}}>{notif.message}</p>
                          <small style={{color: '#64748b'}}>
                            {new Date(notif.time).toLocaleString()}
                          </small>
                        </div>
                        {!notif.read && (
                          <span style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: '#2196f3'
                          }}></span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Attendance Reports */}
          {activeMenu === 'attendance-reports' && (
            <div className="form-card">
              <h2>📈 Individual Attendance Reports</h2>
              
              <div className="form-group">
                <label>Select Student</label>
                <select 
                  value={selectedStudentForAttendance || ''}
                  onChange={(e) => loadIndividualAttendance(e.target.value)}
                >
                  <option value="">Choose a student...</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.fullName} ({student.studentId})
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudentForAttendance && studentAttendanceReport.length > 0 && (
                <div className="data-table-container" style={{marginTop: '20px'}}>
                  <h3>Attendance History</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Class Name</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentAttendanceReport.map((record, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{record.className}</td>
                          <td>{new Date(record.date).toLocaleDateString()}</td>
                          <td>
                            {record.status === 'present' ? (
                              <span className="badge badge-success">Present</span>
                            ) : (
                              <span className="badge badge-danger">Absent</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div className="form-card" style={{marginTop: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white'}}>
                    <h3 style={{color: 'white'}}>📊 Attendance Summary</h3>
                    <p style={{fontSize: '18px', margin: '10px 0'}}>
                      Total Classes: {studentAttendanceReport.length}
                    </p>
                    <p style={{fontSize: '18px', margin: '10px 0'}}>
                      Present: {studentAttendanceReport.filter(r => r.status === 'present').length}
                    </p>
                    <p style={{fontSize: '18px', margin: '10px 0'}}>
                      Absent: {studentAttendanceReport.filter(r => r.status === 'absent').length}
                    </p>
                    <p style={{fontSize: '24px', fontWeight: 'bold', margin: '10px 0'}}>
                      Attendance Rate: {((studentAttendanceReport.filter(r => r.status === 'present').length / studentAttendanceReport.length) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Assignments */}
          {activeMenu === 'assignments' && (
            <div className="form-card">
              <h2>📄 Create Assignment</h2>
              <form onSubmit={handleCreateAssignment}>
                <div className="form-group">
                  <label>Assignment Title *</label>
                  <input
                    type="text"
                    value={assignmentForm.title}
                    onChange={(e) => setAssignmentForm({...assignmentForm, title: e.target.value})}
                    required
                    placeholder="e.g., Chapter 5 Homework"
                  />
                </div>

                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    value={assignmentForm.description}
                    onChange={(e) => setAssignmentForm({...assignmentForm, description: e.target.value})}
                    rows="5"
                    required
                    placeholder="Provide detailed instructions for students..."
                  ></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Due Date *</label>
                    <input
                      type="datetime-local"
                      value={assignmentForm.dueDate}
                      onChange={(e) => setAssignmentForm({...assignmentForm, dueDate: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Max Marks *</label>
                    <input
                      type="number"
                      value={assignmentForm.maxMarks}
                      onChange={(e) => setAssignmentForm({...assignmentForm, maxMarks: e.target.value})}
                      required
                      min="1"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Upload Assignment PDF *</label>
                  <input
                    type="file"
                    id="assignmentFileInput"
                    accept=".pdf"
                    onChange={(e) => setAssignmentFile(e.target.files[0])}
                    required
                    style={{
                      padding: '10px',
                      border: '2px dashed #3b82f6',
                      borderRadius: '8px',
                      background: '#f0f9ff',
                      cursor: 'pointer'
                    }}
                  />
                  {assignmentFile && (
                    <div style={{marginTop: '10px', color: '#059669', fontSize: '14px'}}>
                      ✓ Selected: {assignmentFile.name}
                    </div>
                  )}
                </div>

                <button type="submit" className="btn-primary">
                  📤 Create & Send to All Students
                </button>
              </form>

              {assignments.length > 0 && (
                <div style={{marginTop: '30px'}}>
                  <h3>📋 My Assignments ({assignments.length})</h3>
                  <div style={{display: 'grid', gap: '15px', marginTop: '15px'}}>
                    {assignments.map(assignment => (
                      <div key={assignment.id} className="form-card" style={{background: '#f0f9ff'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                          <div style={{flex: 1}}>
                            <h4>{assignment.title}</h4>
                            <p style={{color: '#64748b', margin: '10px 0'}}>{assignment.description}</p>
                            <p style={{fontSize: '14px', color: '#64748b'}}>
                              📅 Due: {new Date(assignment.dueDate).toLocaleString()}
                            </p>
                            <p style={{fontSize: '14px', color: '#64748b'}}>
                              📊 Max Marks: {assignment.maxMarks}
                            </p>
                            {assignment.filePath && (
                              <p style={{fontSize: '14px', color: '#3b82f6'}}>
                                📎 File: {assignment.filePath.split('/').pop()}
                              </p>
                            )}
                          </div>
                          <button
                            className="btn-danger"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            style={{
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                        <div style={{marginTop: '15px', display: 'flex', gap: '10px'}}>
                          <button 
                            className="btn-secondary"
                            onClick={() => loadAssignmentSubmissions(assignment.id)}
                          >
                            📝 View Submissions
                          </button>
                          {assignment.filePath && (
                            <a
                              href={`http://localhost:5000${assignment.filePath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-secondary"
                              style={{textDecoration: 'none'}}
                            >
                              📥 Download PDF
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Grading */}
          {activeMenu === 'grading' && !selectedAssignment && (
            <div className="data-table-container">
              <h2>✍️ Grade Assignments</h2>
              <p style={{color: '#64748b', margin: '20px 0'}}>
                Select an assignment from the Assignments section to view and grade submissions.
              </p>
              <button 
                className="btn-primary"
                onClick={() => setActiveMenu('assignments')}
              >
                📄 Go to Assignments
              </button>
            </div>
          )}

          {activeMenu === 'grade-assignments' && selectedAssignment && (
            <div className="data-table-container">
              <button 
                className="btn-secondary"
                onClick={() => setActiveMenu('assignments')}
                style={{marginBottom: '20px'}}
              >
                ← Back to Assignments
              </button>

              <h2>✍️ Grade Submissions - {selectedAssignment.title}</h2>
              
              {assignmentSubmissions.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📝</span>
                  <p>No submissions yet</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student Name</th>
                      <th>Submitted At</th>
                      <th>Marks</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignmentSubmissions.map((submission, index) => (
                      <tr key={submission.id}>
                        <td>{index + 1}</td>
                        <td>{submission.studentName}</td>
                        <td>{new Date(submission.submittedAt).toLocaleString()}</td>
                        <td>
                          {submission.marks !== null ? (
                            <strong>{submission.marks}/{selectedAssignment.maxMarks}</strong>
                          ) : (
                            <input
                              type="number"
                              placeholder="Marks"
                              max={selectedAssignment.maxMarks}
                              style={{width: '80px', padding: '5px'}}
                              id={`marks-${submission.id}`}
                            />
                          )}
                        </td>
                        <td>
                          {submission.marks !== null ? (
                            <span className="badge badge-success">Graded</span>
                          ) : (
                            <span className="badge badge-warning">Pending</span>
                          )}
                        </td>
                        <td>
                          {submission.marks === null && (
                            <button
                              className="btn-primary"
                              onClick={() => {
                                const marks = document.getElementById(`marks-${submission.id}`).value;
                                if (marks) {
                                  handleGradeSubmission(submission.id, marks, 'Good work');
                                }
                              }}
                            >
                              Submit Grade
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Quizzes */}
          {activeMenu === 'quizzes' && (
            <div className="form-card">
              <h2>📝 Create Quiz/Test</h2>
              <form onSubmit={handleCreateQuiz}>
                <div className="form-group">
                  <label>Quiz Title *</label>
                  <input
                    type="text"
                    value={quizForm.title}
                    onChange={(e) => setQuizForm({...quizForm, title: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={quizForm.description}
                    onChange={(e) => setQuizForm({...quizForm, description: e.target.value})}
                    rows="3"
                  ></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Duration (minutes) *</label>
                    <input
                      type="number"
                      value={quizForm.duration}
                      onChange={(e) => setQuizForm({...quizForm, duration: e.target.value})}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Total Marks *</label>
                    <input
                      type="number"
                      value={quizForm.totalMarks}
                      onChange={(e) => setQuizForm({...quizForm, totalMarks: e.target.value})}
                      required
                    />
                  </div>
                </div>

                {/* Question Builder */}
                <div className="form-card" style={{background: '#f0f9ff', marginTop: '20px'}}>
                  <h3>➕ Add Question</h3>
                  
                  <div className="form-group">
                    <label>Question Text *</label>
                    <input
                      type="text"
                      value={currentQuestion.question}
                      onChange={(e) => setCurrentQuestion({...currentQuestion, question: e.target.value})}
                    />
                  </div>

                  {currentQuestion.options.map((option, index) => (
                    <div className="form-group" key={index}>
                      <label>Option {index + 1} *</label>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...currentQuestion.options];
                          newOptions[index] = e.target.value;
                          setCurrentQuestion({...currentQuestion, options: newOptions});
                        }}
                      />
                    </div>
                  ))}

                  <div className="form-row">
                    <div className="form-group">
                      <label>Correct Answer *</label>
                      <select
                        value={currentQuestion.correctAnswer}
                        onChange={(e) => setCurrentQuestion({...currentQuestion, correctAnswer: parseInt(e.target.value)})}
                      >
                        <option value={0}>Option 1</option>
                        <option value={1}>Option 2</option>
                        <option value={2}>Option 3</option>
                        <option value={3}>Option 4</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Marks *</label>
                      <input
                        type="number"
                        value={currentQuestion.marks}
                        onChange={(e) => setCurrentQuestion({...currentQuestion, marks: e.target.value})}
                      />
                    </div>
                  </div>

                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={handleAddQuestion}
                  >
                    ➕ Add Question to Quiz
                  </button>
                </div>

                {quizForm.questions.length > 0 && (
                  <div style={{marginTop: '20px'}}>
                    <h3>📋 Questions Added ({quizForm.questions.length})</h3>
                    {quizForm.questions.map((q, index) => (
                      <div key={index} className="form-card" style={{background: '#dcfce7'}}>
                        <p><strong>Q{index + 1}:</strong> {q.question}</p>
                        <p style={{fontSize: '14px', color: '#64748b'}}>
                          Correct Answer: Option {q.correctAnswer + 1} | Marks: {q.marks}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={quizForm.questions.length === 0}
                  style={{marginTop: '20px'}}
                >
                  🚀 Create Quiz & Make Available to Students
                </button>
              </form>
            </div>
          )}

          {/* Reports */}
          {activeMenu === 'reports' && (
            <div className="form-card">
              <h2>📊 Reports & Analytics</h2>
              
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px'}}>
                <div className="form-card" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white'}}>
                  <h3 style={{color: 'white'}}>📄 Assignment Overview</h3>
                  <p style={{fontSize: '32px', fontWeight: 'bold', margin: '20px 0'}}>
                    {assignments.length}
                  </p>
                  <p>Total Assignments Created</p>
                  <button 
                    className="btn-secondary"
                    style={{marginTop: '15px'}}
                    onClick={() => setActiveMenu('assignments')}
                  >
                    View Details
                  </button>
                </div>

                <div className="form-card" style={{background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white'}}>
                  <h3 style={{color: 'white'}}>📋 Exam Reports</h3>
                  <p style={{fontSize: '32px', fontWeight: 'bold', margin: '20px 0'}}>
                    {myExams.length}
                  </p>
                  <p>Total Exams Conducted</p>
                  <button 
                    className="btn-secondary"
                    style={{marginTop: '15px'}}
                    onClick={() => setActiveMenu('examinations')}
                  >
                    View Details
                  </button>
                </div>

                <div className="form-card" style={{background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white'}}>
                  <h3 style={{color: 'white'}}>📝 Quiz Reports</h3>
                  <p style={{fontSize: '32px', fontWeight: 'bold', margin: '20px 0'}}>
                    {quizzes.length}
                  </p>
                  <p>Total Quizzes Created</p>
                  <button 
                    className="btn-secondary"
                    style={{marginTop: '15px'}}
                    onClick={() => setActiveMenu('quizzes')}
                  >
                    View Details
                  </button>
                </div>

                <div className="form-card" style={{background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white'}}>
                  <h3 style={{color: 'white'}}>📈 Attendance Summary</h3>
                  <p style={{fontSize: '32px', fontWeight: 'bold', margin: '20px 0'}}>
                    {myClasses.length}
                  </p>
                  <p>Total Classes Conducted</p>
                  <button 
                    className="btn-secondary"
                    style={{marginTop: '15px'}}
                    onClick={() => setActiveMenu('attendance-reports')}
                  >
                    View Reports
                  </button>
                </div>

                <div className="form-card" style={{background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white'}}>
                  <h3 style={{color: 'white'}}>👥 Student Performance</h3>
                  <p style={{fontSize: '32px', fontWeight: 'bold', margin: '20px 0'}}>
                    {students.length}
                  </p>
                  <p>Total Students</p>
                  <button 
                    className="btn-secondary"
                    style={{marginTop: '15px'}}
                    onClick={() => setActiveMenu('students')}
                  >
                    View Students
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Communication */}
          {activeMenu === 'communication' && (
            <div className="form-card">
              <h2>💬 Communication Tools</h2>
              
              <div style={{display: 'grid', gap: '20px'}}>
                {/* Send Message */}
                <div className="form-card" style={{background: '#f0f9ff'}}>
                  <h3>📧 Send Message</h3>
                  <form onSubmit={handleSendMessage}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Recipient Type *</label>
                        <select
                          value={messageForm.recipientType}
                          onChange={(e) => setMessageForm({...messageForm, recipientType: e.target.value})}
                        >
                          <option value="student">Student</option>
                          <option value="parent">Parent</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Select Recipient *</label>
                        <select
                          value={messageForm.recipientId}
                          onChange={(e) => setMessageForm({...messageForm, recipientId: e.target.value})}
                          required
                        >
                          <option value="">Choose...</option>
                          {students.map(student => (
                            <option key={student.id} value={student.id}>
                              {student.fullName} ({messageForm.recipientType === 'parent' ? 'Parent' : 'Student'})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Subject *</label>
                      <input
                        type="text"
                        value={messageForm.subject}
                        onChange={(e) => setMessageForm({...messageForm, subject: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Message *</label>
                      <textarea
                        value={messageForm.message}
                        onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
                        rows="5"
                        required
                      ></textarea>
                    </div>

                    <button type="submit" className="btn-primary">
                      📤 Send Message
                    </button>
                  </form>
                </div>

                {/* Feedback System */}
                <div className="form-card" style={{background: '#fef3c7'}}>
                  <h3>⭐ Student Feedback & Remarks</h3>
                  <div className="form-group">
                    <label>Select Student *</label>
                    <select id="feedback-student">
                      <option value="">Choose a student...</option>
                      {students.map(student => (
                        <option key={student.id} value={student.id}>
                          {student.fullName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Feedback Category *</label>
                    <select id="feedback-category">
                      <option value="academic">Academic Performance</option>
                      <option value="behavior">Behavior</option>
                      <option value="participation">Class Participation</option>
                      <option value="improvement">Areas for Improvement</option>
                      <option value="appreciation">Appreciation</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Remarks *</label>
                    <textarea id="feedback-remarks" rows="4"></textarea>
                  </div>

                  <button 
                    className="btn-primary"
                    onClick={() => {
                      const studentId = document.getElementById('feedback-student').value;
                      const category = document.getElementById('feedback-category').value;
                      const remarks = document.getElementById('feedback-remarks').value;
                      if (studentId && remarks) {
                        handleSendFeedback(studentId, remarks, category);
                        document.getElementById('feedback-remarks').value = '';
                      }
                    }}
                  >
                    📝 Submit Feedback
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Announcements */}
          {activeMenu === 'announcements' && (
            <div className="form-card">
              <h2>📢 Announcements / Notice Board</h2>
              
              <form onSubmit={handleCreateAnnouncement}>
                <div className="form-group">
                  <label>Announcement Title *</label>
                  <input
                    type="text"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Content *</label>
                  <textarea
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                    rows="5"
                    required
                  ></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Priority *</label>
                    <select
                      value={announcementForm.priority}
                      onChange={(e) => setAnnouncementForm({...announcementForm, priority: e.target.value})}
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Target Audience *</label>
                    <select
                      value={announcementForm.targetAudience}
                      onChange={(e) => setAnnouncementForm({...announcementForm, targetAudience: e.target.value})}
                    >
                      <option value="all">All Students</option>
                      <option value="class">Specific Class</option>
                      <option value="parents">Parents</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn-primary">
                  📣 Post Announcement
                </button>
              </form>

              {/* Recent Announcements */}
              {announcements.length > 0 && (
                <div style={{marginTop: '30px'}}>
                  <h3>📋 Recent Announcements</h3>
                  <div style={{display: 'grid', gap: '15px', marginTop: '15px'}}>
                    {announcements.map(announcement => (
                      <div 
                        key={announcement.id} 
                        className="form-card" 
                        style={{
                          background: announcement.priority === 'urgent' ? '#fee2e2' : announcement.priority === 'high' ? '#fef3c7' : '#f0f9ff',
                          borderLeft: `4px solid ${announcement.priority === 'urgent' ? '#dc2626' : announcement.priority === 'high' ? '#f59e0b' : '#3b82f6'}`
                        }}
                      >
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'start'}}>
                          <h4>{announcement.title}</h4>
                          <span className={`badge badge-${announcement.priority === 'urgent' ? 'danger' : announcement.priority === 'high' ? 'warning' : 'info'}`}>
                            {announcement.priority.toUpperCase()}
                          </span>
                        </div>
                        <p style={{margin: '10px 0', color: '#64748b'}}>{announcement.content}</p>
                        <small style={{color: '#64748b'}}>
                          Posted: {new Date(announcement.createdAt).toLocaleString()}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Settings */}
          {activeMenu === 'give-feedback' && (
            <div className="feedback-management-section">
              <h2>📝 Give Student Feedback</h2>
              
              {/* Feedback Form */}
              <div className="feedback-form-container">
                <form onSubmit={handleSubmitFeedback} className="feedback-form">
                  <h3>{editingFeedback ? '✏️ Edit Feedback' : '➕ Create New Feedback'}</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>👨‍🎓 Select Student *</label>
                      <select
                        value={feedbackForm.studentId}
                        onChange={(e) => setFeedbackForm({...feedbackForm, studentId: e.target.value})}
                        required
                      >
                        <option value="">Choose a student...</option>
                        {students.map(student => (
                          <option key={student.id} value={student.id}>
                            {student.fullName} ({student.studentId || student.email})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>📋 Feedback Type *</label>
                      <select
                        value={feedbackForm.type}
                        onChange={(e) => setFeedbackForm({...feedbackForm, type: e.target.value})}
                        required
                      >
                        <option value="general">💡 General</option>
                        <option value="assignment">📝 Assignment</option>
                        <option value="exam">📊 Exam</option>
                        <option value="behavior">👤 Behavior</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>📌 Subject</label>
                    <input
                      type="text"
                      placeholder="Feedback subject or title..."
                      value={feedbackForm.subject}
                      onChange={(e) => setFeedbackForm({...feedbackForm, subject: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label>💬 Feedback Message *</label>
                    <textarea
                      placeholder="Write your detailed feedback here..."
                      value={feedbackForm.message}
                      onChange={(e) => setFeedbackForm({...feedbackForm, message: e.target.value})}
                      rows="6"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>⭐ Rating (Optional): {feedbackForm.rating}/5</label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={feedbackForm.rating}
                      onChange={(e) => setFeedbackForm({...feedbackForm, rating: parseInt(e.target.value)})}
                      className="rating-slider"
                    />
                    <div className="rating-stars">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star} className={star <= feedbackForm.rating ? 'star filled' : 'star'}>⭐</span>
                      ))}
                    </div>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary">
                      {editingFeedback ? '💾 Update Feedback' : '📤 Send Feedback'}
                    </button>
                    {editingFeedback && (
                      <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={() => {
                          setEditingFeedback(null);
                          setFeedbackForm({studentId: '', subject: '', message: '', type: 'general', rating: 3});
                        }}
                      >
                        ❌ Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* My Given Feedback List */}
              <div className="feedback-history-container">
                <h3>📋 My Given Feedback</h3>
                
                {feedbackLoading ? (
                  <div className="loading-spinner">Loading feedback...</div>
                ) : myGivenFeedback.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">💭</div>
                    <p>No feedback given yet</p>
                  </div>
                ) : (
                  <div className="feedback-list">
                    {myGivenFeedback.map(feedback => (
                      <div key={feedback.id} className="feedback-card">
                        <div className="feedback-header">
                          <div className="feedback-student">
                            <div className="student-avatar">👨‍🎓</div>
                            <div>
                              <h4>{feedback.Student?.studentName || 'Unknown'}</h4>
                              <p className="feedback-date">
                                {new Date(feedback.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <span className={`feedback-type ${feedback.type}`}>
                            {feedback.type === 'assignment' && '📝 Assignment'}
                            {feedback.type === 'exam' && '📊 Exam'}
                            {feedback.type === 'general' && '💡 General'}
                            {feedback.type === 'behavior' && '👤 Behavior'}
                          </span>
                        </div>

                        {feedback.subject && (
                          <h3 className="feedback-subject">{feedback.subject}</h3>
                        )}

                        <div className="feedback-content">
                          <p>{feedback.message}</p>
                        </div>

                        {feedback.rating && (
                          <div className="feedback-rating">
                            <span className="rating-label">Rating:</span>
                            <div className="stars">
                              {[1, 2, 3, 4, 5].map(star => (
                                <span key={star} className={star <= feedback.rating ? 'star filled' : 'star'}>
                                  ⭐
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="feedback-actions">
                          <button 
                            className="btn-edit"
                            onClick={() => handleEditFeedback(feedback)}
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            className="btn-delete"
                            onClick={() => handleDeleteFeedback(feedback.id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Batch Management */}
          {activeMenu === 'batch-management' && (
            <div className="batch-management-section">
              <h2>👥 Batch & Section Management</h2>
              
              {/* Create New Section Form */}
              <div className="batch-form-container">
                <form onSubmit={handleCreateSection} className="batch-form">
                  <h3>➕ Create New Section</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Section Name *</label>
                      <input
                        type="text"
                        placeholder="e.g., Section A"
                        value={sectionForm.sectionName}
                        onChange={(e) => setSectionForm({...sectionForm, sectionName: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Batch Year *</label>
                      <input
                        type="text"
                        placeholder="e.g., 2024-2025"
                        value={sectionForm.batchYear}
                        onChange={(e) => setSectionForm({...sectionForm, batchYear: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Semester *</label>
                      <select
                        value={sectionForm.semester}
                        onChange={(e) => setSectionForm({...sectionForm, semester: e.target.value})}
                        required
                      >
                        <option value="">Select Semester</option>
                        {[1,2,3,4,5,6,7,8].map(sem => (
                          <option key={sem} value={`Semester ${sem}`}>Semester {sem}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Subject *</label>
                      <input
                        type="text"
                        placeholder="e.g., Computer Science"
                        value={sectionForm.subject}
                        onChange={(e) => setSectionForm({...sectionForm, subject: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      placeholder="Additional details about the section..."
                      value={sectionForm.description}
                      onChange={(e) => setSectionForm({...sectionForm, description: e.target.value})}
                      rows="3"
                    />
                  </div>

                  <button type="submit" className="btn-primary">
                    ➕ Create Section
                  </button>
                </form>
              </div>

              {/* My Sections List */}
              <div className="sections-list-container">
                <h3>📚 My Sections ({mySections.length})</h3>
                
                {sectionsLoading ? (
                  <div className="loading-spinner">Loading sections...</div>
                ) : mySections.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <p>No sections created yet</p>
                  </div>
                ) : (
                  <div className="sections-grid">
                    {mySections.map(section => (
                      <div key={section.id} className="section-manage-card">
                        <div className="section-manage-header">
                          <h4>{section.sectionName}</h4>
                          <span className="section-subject-badge">{section.subject}</span>
                        </div>

                        <div className="section-manage-info">
                          <p><strong>Batch:</strong> {section.batchYear}</p>
                          <p><strong>Semester:</strong> {section.semester}</p>
                          <p><strong>Students:</strong> {section.totalStudents}</p>
                        </div>

                        <div className="section-students-area">
                          <h5>Enrolled Students:</h5>
                          {section.Students && section.Students.length > 0 ? (
                            <div className="enrolled-students-list">
                              {section.Students.map(student => (
                                <div key={student.id} className="enrolled-student-item">
                                  <div>
                                    <strong>{student.fullName}</strong>
                                    <span> ({student.studentId || student.email})</span>
                                  </div>
                                  <button 
                                    className="btn-remove-student"
                                    onClick={() => handleRemoveStudentFromSection(section.id, student.id)}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="no-students">No students enrolled yet</p>
                          )}
                        </div>

                        <div className="section-add-student">
                          <h5>Add Student:</h5>
                          <select 
                            className="student-select"
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAddStudentToSection(section.id, parseInt(e.target.value));
                                e.target.value = '';
                              }
                            }}
                          >
                            <option value="">Select student to add...</option>
                            {students
                              .filter(s => !section.Students?.find(enrolled => enrolled.id === s.id))
                              .map(student => (
                                <option key={student.id} value={student.id}>
                                  {student.fullName} ({student.studentId || student.email})
                                </option>
                              ))
                            }
                          </select>
                        </div>

                        <button 
                          className="btn-delete-section"
                          onClick={() => handleDeleteSection(section.id)}
                        >
                          🗑️ Delete Section
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timetable Management */}
          {activeMenu === 'timetable-management' && (
            <div className="timetable-management-section">
              <h2>📅 Offline Class Timetable Management</h2>
              
              {/* Create Offline Class Form */}
              <div className="timetable-form-container">
                <form onSubmit={handleCreateOfflineClass} className="timetable-form">
                  <h3>{editingOfflineClass ? '✏️ Edit Class Schedule' : '➕ Schedule Offline Class'}</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Section *</label>
                      <select
                        value={offlineClassForm.sectionId}
                        onChange={(e) => setOfflineClassForm({...offlineClassForm, sectionId: e.target.value})}
                        required
                      >
                        <option value="">Select Section</option>
                        {mySections.map(section => (
                          <option key={section.id} value={section.id}>
                            {section.sectionName} - {section.subject}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Subject *</label>
                      <input
                        type="text"
                        placeholder="Subject name"
                        value={offlineClassForm.subject}
                        onChange={(e) => setOfflineClassForm({...offlineClassForm, subject: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Day of Week *</label>
                      <select
                        value={offlineClassForm.dayOfWeek}
                        onChange={(e) => setOfflineClassForm({...offlineClassForm, dayOfWeek: e.target.value})}
                        required
                      >
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Class Type *</label>
                      <select
                        value={offlineClassForm.classType}
                        onChange={(e) => setOfflineClassForm({...offlineClassForm, classType: e.target.value})}
                        required
                      >
                        <option value="lecture">Lecture</option>
                        <option value="lab">Lab</option>
                        <option value="tutorial">Tutorial</option>
                        <option value="practical">Practical</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Time *</label>
                      <input
                        type="time"
                        value={offlineClassForm.startTime}
                        onChange={(e) => setOfflineClassForm({...offlineClassForm, startTime: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>End Time *</label>
                      <input
                        type="time"
                        value={offlineClassForm.endTime}
                        onChange={(e) => setOfflineClassForm({...offlineClassForm, endTime: e.target.value})}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Room Number</label>
                      <input
                        type="text"
                        placeholder="e.g., Room 101"
                        value={offlineClassForm.roomNumber}
                        onChange={(e) => setOfflineClassForm({...offlineClassForm, roomNumber: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Notes</label>
                    <textarea
                      placeholder="Additional information about the class..."
                      value={offlineClassForm.notes}
                      onChange={(e) => setOfflineClassForm({...offlineClassForm, notes: e.target.value})}
                      rows="3"
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn-primary">
                      {editingOfflineClass ? '💾 Update Class' : '📅 Schedule Class'}
                    </button>
                    {editingOfflineClass && (
                      <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={() => {
                          setEditingOfflineClass(null);
                          setOfflineClassForm({
                            sectionId: '', subject: '', dayOfWeek: 'Monday',
                            startTime: '', endTime: '', roomNumber: '', classType: 'lecture', notes: ''
                          });
                        }}
                      >
                        ❌ Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Scheduled Classes Table */}
              <div className="scheduled-classes-container">
                <h3>📋 Scheduled Offline Classes</h3>
                
                {offlineClasses.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <p>No offline classes scheduled yet</p>
                  </div>
                ) : (
                  <div className="timetable-table">
                    <table className="timetable">
                      <thead>
                        <tr>
                          <th>Day</th>
                          <th>Time</th>
                          <th>Subject</th>
                          <th>Section</th>
                          <th>Room</th>
                          <th>Type</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {offlineClasses.map(cls => (
                          <tr key={cls.id}>
                            <td><strong>{cls.dayOfWeek}</strong></td>
                            <td>{cls.startTime} - {cls.endTime}</td>
                            <td>{cls.subject}</td>
                            <td>{cls.Section?.sectionName}</td>
                            <td>{cls.roomNumber || 'TBA'}</td>
                            <td><span className={`type-badge ${cls.classType}`}>{cls.classType}</span></td>
                            <td>
                              <button 
                                className="btn-table-edit"
                                onClick={() => {
                                  setEditingOfflineClass(cls);
                                  setOfflineClassForm({
                                    sectionId: cls.sectionId,
                                    subject: cls.subject,
                                    dayOfWeek: cls.dayOfWeek,
                                    startTime: cls.startTime,
                                    endTime: cls.endTime,
                                    roomNumber: cls.roomNumber || '',
                                    classType: cls.classType,
                                    notes: cls.notes || ''
                                  });
                                  window.scrollTo({top: 0, behavior: 'smooth'});
                                }}
                              >
                                ✏️
                              </button>
                              <button 
                                className="btn-table-delete"
                                onClick={() => handleDeleteOfflineClass(cls.id)}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeMenu === 'settings' && (
            <div className="settings-container">
              <h2>⚙️ Settings</h2>
              
              <div className="settings-section">
                <h3>🎨 Theme</h3>
                <div className="theme-options">
                  <div 
                    className={`theme-card ${theme === 'light' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('light')}
                  >
                    <div className="theme-preview light-preview"></div>
                    <span>☀️ Light Mode</span>
                  </div>
                  
                  <div 
                    className={`theme-card ${theme === 'dark' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <div className="theme-preview dark-preview"></div>
                    <span>🌙 Dark Mode</span>
                  </div>
                  
                  <div 
                    className={`theme-card ${theme === 'eye-protection' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('eye-protection')}
                  >
                    <div className="theme-preview eye-preview"></div>
                    <span>👁️ Eye Protection</span>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>🔒 Privacy & Permissions</h3>
                <div className="form-card">
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #e2e8f0'}}>
                    <div>
                      <strong>Show Profile to Students</strong>
                      <p style={{fontSize: '14px', color: '#64748b', margin: '5px 0'}}>Allow students to view your profile</p>
                    </div>
                    <input type="checkbox" defaultChecked />
                  </div>
                  
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #e2e8f0'}}>
                    <div>
                      <strong>Email Notifications</strong>
                      <p style={{fontSize: '14px', color: '#64748b', margin: '5px 0'}}>Receive email notifications for submissions</p>
                    </div>
                    <input type="checkbox" defaultChecked />
                  </div>
                  
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0'}}>
                    <div>
                      <strong>Auto-publish Results</strong>
                      <p style={{fontSize: '14px', color: '#64748b', margin: '5px 0'}}>Automatically publish results after grading</p>
                    </div>
                    <input type="checkbox" />
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>👤 Account</h3>
                <div className="account-info">
                  <p><strong>Name:</strong> {user?.facultyName}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>Teacher ID:</strong> {user?.teacherId}</p>
                  <p><strong>Subject:</strong> {user?.subject || 'N/A'}</p>
                </div>
                <button className="logout-btn-settings" onClick={logout}>
                  🚪 Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard_New;

