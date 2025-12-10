import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { liveClassService, courseService, onlineExamService, assignmentService, feeService, notificationService, studentToolsService } from '../services/api';
import axios from 'axios';
import Messages from '../components/Messages';
import StudentProfile from '../components/StudentProfile';
import StudentChat from '../components/StudentChat';
import StudentExams from '../components/StudentExams';
import IDCardGenerator from '../components/IDCardGenerator';
import './Dashboard_New.css';
import './StudentDashboard.css';
import './StatusMessages.css';
import '../components/StudentProfile.css';

const StudentDashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joinMessage, setJoinMessage] = useState('');
  const [error, setError] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [showIDCard, setShowIDCard] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard'); // dashboard, courses, assignments, attendance, notifications, live-classes, messages, chat, exams, results, fee-status
  const [examType, setExamType] = useState('quizzes'); // quizzes or finals
  const [teacherExams, setTeacherExams] = useState([]);
  const [adminExams, setAdminExams] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submittedAssignments, setSubmittedAssignments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [myResults, setMyResults] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [todos, setTodos] = useState([]);
  const [theme, setTheme] = useState(localStorage.getItem('studentTheme') || 'light');
  const [myFees, setMyFees] = useState([]);
  const [myPayments, setMyPayments] = useState([]);
  const [feeLoading, setFeeLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'upi',
    transactionId: '',
    upiId: ''
  });
  const [feeQueryForm, setFeeQueryForm] = useState({
    subject: '',
    message: ''
  });
  const [myFeedback, setMyFeedback] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Classes submenu state
  const [classesSubmenu, setClassesSubmenu] = useState(false);
  const [mySections, setMySections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null);
  const [sectionDetails, setSectionDetails] = useState(null);
  const [myTimetable, setMyTimetable] = useState([]);
  const [timetableLoading, setTimetableLoading] = useState(false);

  // Student Tools state
  const [toolsExpanded, setToolsExpanded] = useState({
    notes: false,
    todos: false,
    aiChat: false,
    classmateChat: false
  });
  const [notes, setNotes] = useState([]);
  const [currentNote, setCurrentNote] = useState({ title: '', content: '' });
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [classmateMessages, setClassmateMessages] = useState([]);
  const [classmateInput, setClassmateInput] = useState('');
  const [selectedChatSection, setSelectedChatSection] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingInterval = useRef(null);
  const aiMessagesEndRef = useRef(null);
  const classmateMessagesEndRef = useRef(null);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        await loadClasses();
        await loadEnrolledCourses();
        await loadAssignments();
        await loadNotifications();
        await loadMySections();
        loadAttendanceData();
      } catch (err) {
        console.error('Error initializing dashboard:', err);
      }
    };

    initializeDashboard();
    
    const interval = setInterval(() => {
      loadClasses();
      loadNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeMenu === 'results') {
      loadMyResults();
    }
    if (activeMenu === 'student-tools') {
      loadTodos();
    }
    if (activeMenu === 'fee-status') {
      loadMyFees();
    }
    if (activeMenu === 'my-feedback') {
      loadMyFeedback();
    }
    if (activeMenu === 'timetable' || activeMenu === 'offline-classes') {
      loadMyTimetable();
    }
  }, [activeMenu]);

  useEffect(() => {
    document.body.className = theme;
    localStorage.setItem('studentTheme', theme);
  }, [theme]);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const loadTodos = async () => {
    // For backwards compatibility, try localStorage first, then migrate to API
    const savedTodos = JSON.parse(localStorage.getItem('studentTodos') || '[]');
    if (savedTodos.length > 0) {
      setTodos(savedTodos);
    } else {
      try {
        const response = await studentToolsService.getTodos();
        setTodos(response.data.todos || []);
      } catch (err) {
        console.error('Error loading todos:', err);
        setTodos([]);
      }
    }
  };

  const addTodo = (text) => {
    const newTodo = { id: Date.now(), text, done: false };
    const updatedTodos = [...todos, newTodo];
    setTodos(updatedTodos);
    localStorage.setItem('studentTodos', JSON.stringify(updatedTodos));
  };

  const toggleTodo = (id) => {
    const updatedTodos = todos.map(todo => 
      todo.id === id ? { ...todo, done: !todo.done } : todo
    );
    setTodos(updatedTodos);
    localStorage.setItem('studentTodos', JSON.stringify(updatedTodos));
  };

  const deleteTodo = (id) => {
    const updatedTodos = todos.filter(todo => todo.id !== id);
    setTodos(updatedTodos);
    localStorage.setItem('studentTodos', JSON.stringify(updatedTodos));
  };

  const loadClasses = async () => {
    try {
      const res = await liveClassService.getAllClasses();
      setLiveClasses(res.data.liveClasses || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading classes:', err);
      setLoading(false);
    }
  };

  const loadMyFees = async () => {
    try {
      setFeeLoading(true);
      console.log('💰 Loading fee details...');
      const response = await feeService.getMyFees();
      console.log('✅ Fee data received:', response.data);
      
      if (response.data.success) {
        setMyFees(response.data.fees || []);
        setMyPayments(response.data.payments || []);
      }
      setFeeLoading(false);
    } catch (err) {
      console.error('❌ Error loading fees:', err);
      setError('Failed to load fee details');
      setFeeLoading(false);
    }
  };

  const handlePayFee = (fee) => {
    setSelectedFee(fee);
    setPaymentForm({
      amount: fee.pendingAmount.toString(),
      paymentMethod: 'upi',
      transactionId: '',
      upiId: ''
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await feeService.payFee({
        feeId: selectedFee.id,
        amount: parseFloat(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod,
        transactionId: paymentForm.transactionId || `${paymentForm.paymentMethod.toUpperCase()}-${Date.now()}`
      });

      if (response.data.success) {
        setJoinMessage('✅ Payment submitted successfully! Awaiting verification.');
        setShowPaymentModal(false);
        await loadMyFees();
      }
      setLoading(false);
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.response?.data?.message || 'Payment failed');
      setLoading(false);
    }
  };

  const handleSubmitFeeQuery = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await feeService.submitQuery({
        subject: feeQueryForm.subject,
        message: feeQueryForm.message
      });
      
      setJoinMessage('✅ Query submitted successfully!');
      setFeeQueryForm({ subject: '', message: '' });
      setLoading(false);
    } catch (err) {
      console.error('Query submission error:', err);
      setError('Failed to submit query');
      setLoading(false);
    }
  };

  // ==================== STUDENT TOOLS FUNCTIONS ====================
  
  const toggleToolExpanded = (tool) => {
    setToolsExpanded(prev => ({ ...prev, [tool]: !prev[tool] }));
    
    // Load data when expanding
    if (!toolsExpanded[tool]) {
      if (tool === 'notes') loadNotes();
      else if (tool === 'todos') loadTodosFromAPI();
      else if (tool === 'aiChat') loadAIChat();
      else if (tool === 'classmateChat') loadClassmateChat();
    }
  };

  // Notes functions
  const loadNotes = async () => {
    try {
      const response = await studentToolsService.getNotes();
      setNotes(response.data.notes || []);
    } catch (err) {
      console.error('Error loading notes:', err);
    }
  };

  const handleSaveNote = async () => {
    try {
      if (editingNoteId) {
        await studentToolsService.updateNote(editingNoteId, currentNote);
        setJoinMessage('✅ Note updated successfully!');
      } else {
        await studentToolsService.createNote(currentNote);
        setJoinMessage('✅ Note saved successfully!');
      }
      setCurrentNote({ title: '', content: '' });
      setEditingNoteId(null);
      await loadNotes();
      setTimeout(() => setJoinMessage(''), 3000);
    } catch (err) {
      setError('Failed to save note');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEditNote = (note) => {
    setCurrentNote({ title: note.title, content: note.content });
    setEditingNoteId(note.id);
  };

  const handleDeleteNote = async (id) => {
    if (window.confirm('Are you sure you want to delete this note?')) {
      try {
        await studentToolsService.deleteNote(id);
        await loadNotes();
        setJoinMessage('✅ Note deleted');
        setTimeout(() => setJoinMessage(''), 3000);
      } catch (err) {
        setError('Failed to delete note');
      }
    }
  };

  // Todos functions
  const loadTodosFromAPI = async () => {
    try {
      const response = await studentToolsService.getTodos();
      setTodos(response.data.todos || []);
    } catch (err) {
      console.error('Error loading todos:', err);
    }
  };

  const addTodoAPI = async (text) => {
    try {
      await studentToolsService.createTodo({ text });
      await loadTodosFromAPI();
    } catch (err) {
      setError('Failed to add todo');
    }
  };

  const toggleTodoAPI = async (id, done) => {
    try {
      await studentToolsService.updateTodo(id, { done: !done });
      await loadTodosFromAPI();
    } catch (err) {
      setError('Failed to update todo');
    }
  };

  const deleteTodoAPI = async (id) => {
    try {
      await studentToolsService.deleteTodo(id);
      await loadTodosFromAPI();
    } catch (err) {
      setError('Failed to delete todo');
    }
  };

  // AI Chat functions
  const loadAIChat = async () => {
    try {
      const response = await studentToolsService.getAIChats();
      setAiMessages(response.data.chats || []);
      setTimeout(() => aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Error loading AI chat:', err);
    }
  };

  const handleSendAIMessage = async () => {
    if (!aiInput.trim()) return;
    
    try {
      setAiLoading(true);
      const userMsg = aiInput.trim();
      setAiInput('');
      
      // Add user message optimistically
      setAiMessages(prev => [...prev, { role: 'user', message: userMsg, createdAt: new Date() }]);
      
      const response = await studentToolsService.sendAIMessage({ message: userMsg });
      
      // Reload all messages to get AI response
      await loadAIChat();
      setAiLoading(false);
    } catch (err) {
      console.error('Error sending AI message:', err);
      setError('Failed to send message to AI');
      setAiLoading(false);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleClearAIChat = async () => {
    if (window.confirm('Clear all AI chat history?')) {
      try {
        await studentToolsService.clearAIChat();
        setAiMessages([]);
        setJoinMessage('✅ Chat history cleared');
        setTimeout(() => setJoinMessage(''), 3000);
      } catch (err) {
        setError('Failed to clear chat');
      }
    }
  };

  // Classmate Chat functions
  const loadClassmateChat = async () => {
    try {
      const response = await studentToolsService.getClassmateMessages();
      setClassmateMessages(response.data.messages || []);
      
      // If student has sections, set first one as default
      if (response.data.sections && response.data.sections.length > 0 && !selectedChatSection) {
        setSelectedChatSection(response.data.sections[0].id);
      }
      
      setTimeout(() => classmateMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error('Error loading classmate chat:', err);
    }
  };

  const handleSendClassmateMessage = async () => {
    if (!classmateInput.trim() || !selectedChatSection) return;
    
    try {
      await studentToolsService.sendTextMessage({
        message: classmateInput.trim(),
        sectionId: selectedChatSection
      });
      setClassmateInput('');
      await loadClassmateChat();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('voice', blob, 'voice-message.webm');
        formData.append('sectionId', selectedChatSection);
        formData.append('duration', recordingDuration);

        try {
          await studentToolsService.sendVoiceMessage(formData);
          await loadClassmateChat();
          setJoinMessage('✅ Voice message sent!');
          setTimeout(() => setJoinMessage(''), 3000);
        } catch (err) {
          setError('Failed to send voice message');
          setTimeout(() => setError(''), 3000);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingDuration(0);

      recordingInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      setError('Microphone access denied');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(recordingInterval.current);
    }
  };

  const loadMyFeedback = async () => {
    try {
      setFeedbackLoading(true);
      console.log('💬 Loading feedback from teachers...');
      const response = await axios.get('http://localhost:5000/api/feedback/my-feedback', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.data.success) {
        console.log('✅ Loaded', response.data.feedback.length, 'feedback items');
        setMyFeedback(response.data.feedback);
      }
      setFeedbackLoading(false);
    } catch (err) {
      console.error('❌ Error loading feedback:', err);
      setFeedbackLoading(false);
    }
  };

  const loadMySections = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/sections/my-enrolled-sections', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        console.log('👥 Loaded', response.data.sections.length, 'sections');
        setMySections(response.data.sections);
      }
    } catch (err) {
      console.error('❌ Error loading sections:', err);
    }
  };

  const loadSectionDetails = async (sectionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/sections/${sectionId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSectionDetails(response.data.section);
      }
    } catch (err) {
      console.error('❌ Error loading section details:', err);
      setError('Failed to load section details');
    }
  };

  const loadMyTimetable = async () => {
    try {
      setTimetableLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/offline-classes/my-timetable', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        console.log('📅 Loaded timetable with', response.data.offlineClasses.length, 'classes');
        setMyTimetable(response.data.offlineClasses);
      }
      setTimetableLoading(false);
    } catch (err) {
      console.error('❌ Error loading timetable:', err);
      setTimetableLoading(false);
    }
  };

  const loadEnrolledCourses = async () => {
    try {
      console.log('📚 Fetching courses from API...');
      const response = await courseService.getAllCourses();
      console.log('📚 Courses received:', response.data);
      
      if (response.data.success && response.data.courses) {
        setEnrolledCourses(response.data.courses);
        console.log('✅ Loaded', response.data.courses.length, 'courses');
      } else {
        console.warn('⚠️ No courses found in response');
        setEnrolledCourses([]);
      }
    } catch (err) {
      console.error('❌ Error loading courses:', err);
      console.error('❌ Error details:', err.response?.data);
      setEnrolledCourses([]);
    }
  };

  const loadAssignments = async () => {
    try {
      console.log('📝 Loading assignments from API...');
      const response = await assignmentService.getAllAssignments();
      console.log('✅ Assignments loaded:', response.data);
      if (response.data.success && response.data.assignments) {
        setAssignments(response.data.assignments);
      } else {
        console.warn('⚠️ No assignments found');
        setAssignments([]);
      }
    } catch (err) {
      console.error('❌ Error loading assignments:', err);
      console.error('❌ Error details:', err.response?.data);
      setAssignments([]);
    }
  };

  const handleSubmitAssignment = async (assignmentId) => {
    if (!submissionFile) {
      setError('Please select a file to submit');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('assignmentId', assignmentId);
      formData.append('studentId', user.id);
      formData.append('studentName', user.fullName);
      formData.append('submissionFile', submissionFile);

      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/assignments/submit', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setJoinMessage('✅ Assignment submitted successfully!');
      setTimeout(() => setJoinMessage(''), 3000);
      setSubmissionFile(null);
      document.getElementById(`submission-file-${assignmentId}`).value = '';
      loadAssignments();
    } catch (err) {
      console.error('Error submitting assignment:', err);
      setError(err.response?.data?.message || 'Failed to submit assignment');
      setTimeout(() => setError(''), 3000);
    }
  };

  const loadMyResults = async () => {
    try {
      const response = await onlineExamService.getMyResults();
      setMyResults(response.data.results || []);
    } catch (error) {
      console.error('Error loading results:', error);
      setMyResults([]);
    }
  };

  const loadNotifications = async () => {
    try {
      console.log('🔔 Loading notifications...');
      const response = await notificationService.getMyNotifications();
      
      if (response.data.success) {
        console.log('✅ Loaded', response.data.notifications.length, 'notifications');
        setNotifications(response.data.notifications);
      }
    } catch (err) {
      console.error('❌ Error loading notifications:', err);
      setNotifications([]);
    }
  };

  const loadAttendanceData = () => {
    // TODO: Replace with real API call to backend attendance endpoint
    // For now, showing empty to avoid confusion with old dummy data
    console.log('📈 Loading attendance data...');
    setAttendanceData([]);
  };

  const handleJoinClass = async (classId, meetingLink) => {
    try {
      await liveClassService.joinClass(classId);
      setJoinMessage('✅ Joined successfully! Attendance marked. Opening meeting...');
      setError('');
      window.open(meetingLink, '_blank');
      setTimeout(() => setJoinMessage(''), 5000);
      loadClasses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join class');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleDownloadAssignment = (assignment) => {
    const link = document.createElement('a');
    link.href = `http://localhost:5000${assignment.fileUrl}`;
    link.download = assignment.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setJoinMessage(`📥 Downloading ${assignment.fileName}...`);
    setTimeout(() => setJoinMessage(''), 3000);
  };

  const handleEnrollCourse = (courseId) => {
    setJoinMessage('✅ Successfully enrolled in the course!');
    setTimeout(() => setJoinMessage(''), 3000);
  };

  const handleRateCourse = (courseId, rating) => {
    setJoinMessage(`⭐ Course rated ${rating} stars`);
    setTimeout(() => setJoinMessage(''), 3000);
  };

  const handleProfileUpdate = (updatedStudent) => {
    console.log('👤 Profile updated:', updatedStudent);
    updateUser({ ...user, ...updatedStudent });
    // Reload the page content to reflect changes
    if (updatedStudent.profileImage) {
      console.log('✅ Profile image updated, refreshing...');
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const upcomingClasses = liveClasses.filter(c => c.status === 'scheduled' || c.status === 'ongoing');
  const unreadNotifications = notifications.filter(n => !n.isRead).length;
  const overallAttendance = attendanceData.length > 0 
    ? Math.round(attendanceData.reduce((acc, curr) => acc + curr.percentage, 0) / attendanceData.length) 
    : 0;

  if (loading) {
    return (
      <div className="dashboard">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="student-dashboard-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <h2>{sidebarCollapsed ? 'LMS' : 'Student Portal'}</h2>
          <button 
            className="collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? '☰' : '✕'}
          </button>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveMenu('dashboard')}
          >
            <span className="nav-icon">📊</span>
            {!sidebarCollapsed && <span>Dashboard</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveMenu('courses')}
          >
            <span className="nav-icon">📚</span>
            {!sidebarCollapsed && <span>My Courses</span>}
          </button>

          {/* Classes Menu with Submenu */}
          <button 
            className={`nav-item ${['live-classes', 'offline-classes', 'my-section', 'timetable'].includes(activeMenu) ? 'active' : ''}`}
            onClick={() => setClassesSubmenu(!classesSubmenu)}
          >
            <span className="nav-icon">🏫</span>
            {!sidebarCollapsed && (
              <>
                <span>Classes</span>
                <span className="submenu-arrow">{classesSubmenu ? '▼' : '▶'}</span>
              </>
            )}
          </button>

          {!sidebarCollapsed && classesSubmenu && (
            <div className="submenu">
              <button 
                className={`submenu-item ${activeMenu === 'live-classes' ? 'active' : ''}`}
                onClick={() => setActiveMenu('live-classes')}
              >
                <span className="nav-icon">🎥</span>
                <span>Online Classes</span>
              </button>
              
              <button 
                className={`submenu-item ${activeMenu === 'offline-classes' ? 'active' : ''}`}
                onClick={() => { setActiveMenu('offline-classes'); loadMyTimetable(); }}
              >
                <span className="nav-icon">📖</span>
                <span>Offline Classes</span>
              </button>
              
              <button 
                className={`submenu-item ${activeMenu === 'my-section' ? 'active' : ''}`}
                onClick={() => { setActiveMenu('my-section'); loadMySections(); }}
              >
                <span className="nav-icon">👥</span>
                <span>My Section</span>
              </button>
              
              <button 
                className={`submenu-item ${activeMenu === 'timetable' ? 'active' : ''}`}
                onClick={() => { setActiveMenu('timetable'); loadMyTimetable(); }}
              >
                <span className="nav-icon">📅</span>
                <span>Time Table</span>
              </button>
            </div>
          )}

          <button 
            className={`nav-item ${activeMenu === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveMenu('assignments')}
          >
            <span className="nav-icon">📝</span>
            {!sidebarCollapsed && <span>Assignments</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'attendance' ? 'active' : ''}`}
            onClick={() => setActiveMenu('attendance')}
          >
            <span className="nav-icon">📈</span>
            {!sidebarCollapsed && <span>Attendance</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'exams' ? 'active' : ''}`}
            onClick={() => setActiveMenu('exams')}
          >
            <span className="nav-icon">📋</span>
            {!sidebarCollapsed && <span>Exams</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'results' ? 'active' : ''}`}
            onClick={() => setActiveMenu('results')}
          >
            <span className="nav-icon">📊</span>
            {!sidebarCollapsed && <span>My Results</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'fee-status' ? 'active' : ''}`}
            onClick={() => setActiveMenu('fee-status')}
          >
            <span className="nav-icon">💳</span>
            {!sidebarCollapsed && <span>Fee Status</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveMenu('notifications')}
          >
            <span className="nav-icon">🔔</span>
            {!sidebarCollapsed && (
              <>
                <span>Notifications</span>
                {unreadNotifications > 0 && (
                  <span className="notification-badge">{unreadNotifications}</span>
                )}
              </>
            )}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveMenu('messages')}
          >
            <span className="nav-icon">📧</span>
            {!sidebarCollapsed && <span>Messages</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'student-tools' ? 'active' : ''}`}
            onClick={() => setActiveMenu('student-tools')}
          >
            <span className="nav-icon">🛠️</span>
            {!sidebarCollapsed && <span>Student Tools</span>}
          </button>

          <button 
            className={`nav-item ${activeMenu === 'my-feedback' ? 'active' : ''}`}
            onClick={() => setActiveMenu('my-feedback')}
          >
            <span className="nav-icon">💬</span>
            {!sidebarCollapsed && <span>My Feedback</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          <button 
            className="nav-item"
            onClick={() => setShowProfile(true)}
          >
            <span className="nav-icon">👤</span>
            {!sidebarCollapsed && <span>Profile</span>}
          </button>
          <button 
            className="nav-item"
            onClick={() => setShowIDCard(true)}
          >
            <span className="nav-icon">🎓</span>
            {!sidebarCollapsed && <span>Get ID Card</span>}
          </button>
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
        {/* Header */}
        <header className="content-header">
          <div>
            <h1>{activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1).replace('-', ' ')}</h1>
            <p>Welcome back, {user?.fullName}!</p>
          </div>
          <div className="header-profile">
            {user?.profileImage ? (
              <img 
                src={`http://localhost:5000${user.profileImage}`} 
                alt="Profile" 
                className="profile-avatar"
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {user?.fullName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* Messages */}
        {joinMessage && <div className="success-message">{joinMessage}</div>}
        {error && <div className="error-message">{error}</div>}

        {/* Content Area */}
        <div className="content-area">
          {/* Dashboard Overview */}
          {activeMenu === 'dashboard' && (
            <div className="dashboard-overview">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📚</div>
                  <div className="stat-info">
                    <h3>{enrolledCourses.length}</h3>
                    <p>Enrolled Courses</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📝</div>
                  <div className="stat-info">
                    <h3>{assignments.filter(a => a.status === 'pending').length}</h3>
                    <p>Pending Assignments</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📈</div>
                  <div className="stat-info">
                    <h3>{overallAttendance}%</h3>
                    <p>Overall Attendance</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🎥</div>
                  <div className="stat-info">
                    <h3>{upcomingClasses.length}</h3>
                    <p>Upcoming Classes</p>
                  </div>
                </div>
              </div>

              <div className="dashboard-grid">
                <div className="dashboard-card">
                  <h3>📚 Recent Courses</h3>
                  <div className="course-list-small">
                    {enrolledCourses.slice(0, 3).map(course => (
                      <div key={course.id} className="course-item-small">
                        <div>
                          <h4>{course.title}</h4>
                          <p>{course.instructor}</p>
                        </div>
                        <div className="progress-circle">
                          <span>{course.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    className="btn-link"
                    onClick={() => setActiveMenu('courses')}
                  >
                    View All Courses →
                  </button>
                </div>

                <div className="dashboard-card">
                  <h3>🔔 Recent Notifications</h3>
                  <div className="notification-list-small">
                    {notifications.slice(0, 3).map(notification => (
                      <div key={notification.id} className="notification-item-small">
                        <div className={`notification-dot ${notification.type}`}></div>
                        <div>
                          <h4>{notification.title}</h4>
                          <p>{notification.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    className="btn-link"
                    onClick={() => setActiveMenu('notifications')}
                  >
                    View All Notifications →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Courses Module */}
          {activeMenu === 'courses' && (
            <div className="courses-module">
              {selectedCourse ? (
                <div className="course-detail">
                  <button 
                    className="btn-back"
                    onClick={() => setSelectedCourse(null)}
                  >
                    ← Back to Courses
                  </button>
                  
                  <div className="course-header">
                    <div>
                      <h2>{selectedCourse.title}</h2>
                      <p className="instructor">Instructor: {selectedCourse.instructor}</p>
                    </div>
                    <div className="course-rating">
                      <div className="stars">
                        {[1, 2, 3, 4, 5].map(star => (
                          <span 
                            key={star}
                            className={star <= selectedCourse.rating ? 'star filled' : 'star'}
                            onClick={() => handleRateCourse(selectedCourse.id, star)}
                          >
                            ⭐
                          </span>
                        ))}
                      </div>
                      <span>{selectedCourse.rating}/5.0</span>
                    </div>
                  </div>

                  <div className="course-progress-bar">
                    <div className="progress-info">
                      <span>Course Progress</span>
                      <span>{selectedCourse.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${selectedCourse.progress}%` }}
                      ></div>
                    </div>
                    <p>{selectedCourse.completedLessons} of {selectedCourse.totalLessons} lessons completed</p>
                  </div>

                  <div className="course-content">
                    <h3>📹 Video Lectures</h3>
                    {selectedCourse.videos.length > 0 ? (
                      <div className="video-list">
                        {selectedCourse.videos.map(video => (
                          <div key={video.id} className="video-item">
                            <div className="video-icon">▶️</div>
                            <div className="video-info">
                              <h4>{video.title}</h4>
                              <p>Duration: {video.duration}</p>
                            </div>
                            <a 
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-primary btn-sm"
                            >
                              Watch on YouTube
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="no-content">No video lectures available yet.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="courses-grid">
                  {enrolledCourses.map(course => (
                    <div key={course.id} className="course-card">
                      <div className="course-card-header">
                        <h3>{course.title}</h3>
                        <div className="course-rating-small">
                          ⭐ {course.rating}
                        </div>
                      </div>
                      <p className="course-instructor">{course.instructor}</p>
                      
                      <div className="course-progress">
                        <div className="progress-bar-small">
                          <div 
                            className="progress-fill-small"
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                        <span>{course.progress}% Complete</span>
                      </div>

                      <div className="course-stats">
                        <span>📊 {course.completedLessons}/{course.totalLessons} Lessons</span>
                      </div>

                      <button 
                        className="btn btn-primary btn-block"
                        onClick={() => setSelectedCourse(course)}
                      >
                        Continue Learning →
                      </button>
                    </div>
                  ))}

                  <div className="course-card enroll-card">
                    <div className="enroll-content">
                      <h3>🎓 Enroll in New Course</h3>
                      <p>Explore and enroll in available courses</p>
                      <button 
                        className="btn btn-success"
                        onClick={() => handleEnrollCourse()}
                      >
                        Browse Courses
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Live Classes */}
          {activeMenu === 'live-classes' && (
            <div className="live-classes-section">
              {upcomingClasses.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🎥</span>
                  <h3>No Upcoming Classes</h3>
                  <p>Check back later for scheduled live classes</p>
                </div>
              ) : (
                <div className="classes-grid">
                  {upcomingClasses.map(liveClass => (
                    <div key={liveClass.id} className="live-class-card">
                      <div className="class-status-header">
                        <span className={`status-badge ${liveClass.status}`}>
                          {liveClass.status === 'ongoing' ? '🔴 LIVE' : '⏰ Scheduled'}
                        </span>
                      </div>
                      <h3>{liveClass.className}</h3>
                      <p className="class-description">{liveClass.description}</p>
                      
                      <div className="class-meta">
                        <div className="meta-item">
                          <span className="meta-icon">👨‍🏫</span>
                          <span>{liveClass.Teacher?.facultyName}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-icon">📅</span>
                          <span>{new Date(liveClass.scheduledDate).toLocaleDateString()}</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-icon">⏱️</span>
                          <span>{liveClass.duration} minutes</span>
                        </div>
                        <div className="meta-item">
                          <span className="meta-icon">👥</span>
                          <span>{liveClass.joinedStudents?.length || 0} / {liveClass.totalStudents || 0} joined</span>
                        </div>
                      </div>

                      {liveClass.status === 'ongoing' && liveClass.meetingLink && (
                        <button 
                          onClick={() => handleJoinClass(liveClass.id, liveClass.meetingLink)} 
                          className="btn btn-success btn-block btn-pulse"
                        >
                          🎥 Join Class Now
                        </button>
                      )}
                      {liveClass.status === 'scheduled' && (
                        <button className="btn btn-secondary btn-block" disabled>
                          ⏰ Starts at {new Date(liveClass.scheduledDate).toLocaleTimeString()}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Offline Classes Schedule */}
          {activeMenu === 'offline-classes' && (
            <div className="offline-classes-section">
              <h2>📖 Offline Classes Schedule</h2>
              
              {timetableLoading ? (
                <div className="loading-spinner">Loading offline classes...</div>
              ) : myTimetable.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📖</span>
                  <h3>No Offline Classes Scheduled</h3>
                  <p>Your teacher will add offline class schedules soon</p>
                </div>
              ) : (
                <div className="timetable-grid">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                    const dayClasses = myTimetable.filter(c => c.dayOfWeek === day);
                    return (
                      <div key={day} className="day-schedule">
                        <h3 className="day-header">{day}</h3>
                        {dayClasses.length === 0 ? (
                          <p className="no-class">No classes</p>
                        ) : (
                          dayClasses.map(cls => (
                            <div key={cls.id} className="class-time-card">
                              <div className="time-badge">{cls.startTime} - {cls.endTime}</div>
                              <h4>{cls.subject}</h4>
                              <p>👨‍🏫 {cls.Teacher?.facultyName}</p>
                              <p>📍 {cls.roomNumber || 'TBA'}</p>
                              <span className={`class-type-badge ${cls.classType}`}>
                                {cls.classType}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* My Section - View Classmates */}
          {activeMenu === 'my-section' && (
            <div className="my-section-container">
              <h2>👥 My Sections</h2>
              
              {mySections.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">👥</span>
                  <h3>Not Enrolled in Any Section</h3>
                  <p>Your teacher will add you to a section soon</p>
                </div>
              ) : (
                <div className="sections-grid">
                  {mySections.map(section => (
                    <div key={section.id} className="section-card">
                      <div className="section-header">
                        <h3>{section.sectionName}</h3>
                        <span className="section-badge">{section.subject}</span>
                      </div>
                      
                      <div className="section-info">
                        <p><strong>Batch:</strong> {section.batchYear}</p>
                        <p><strong>Semester:</strong> {section.semester}</p>
                        <p><strong>Teacher:</strong> {section.Teacher?.facultyName}</p>
                        <p><strong>Total Students:</strong> {section.totalStudents}</p>
                      </div>
                      
                      <button 
                        className="btn-primary"
                        onClick={() => {
                          setSelectedSection(section.id);
                          loadSectionDetails(section.id);
                        }}
                      >
                        View Classmates
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Section Details Modal */}
              {selectedSection && sectionDetails && (
                <div className="modal-overlay" onClick={() => setSelectedSection(null)}>
                  <div className="modal-content section-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                      <h2>📚 {sectionDetails.sectionName}</h2>
                      <button className="modal-close" onClick={() => setSelectedSection(null)}>✕</button>
                    </div>
                    
                    <div className="section-details-content">
                      <div className="teacher-info">
                        <h3>👨‍🏫 Teacher Information</h3>
                        <div className="teacher-card">
                          <h4>{sectionDetails.Teacher?.facultyName}</h4>
                          <p>📧 {sectionDetails.Teacher?.email}</p>
                          <p>🏛️ {sectionDetails.Teacher?.department}</p>
                          <p>📚 {sectionDetails.subject}</p>
                        </div>
                      </div>

                      <div className="students-list">
                        <h3>👥 Classmates ({sectionDetails.Students?.length || 0} students)</h3>
                        <div className="students-grid">
                          {sectionDetails.Students?.map(student => (
                            <div key={student.id} className="student-item">
                              <div className="student-avatar-sm">👨‍🎓</div>
                              <div className="student-info-sm">
                                <h5>{student.fullName}</h5>
                                <p>{student.studentId || 'No ID'}</p>
                                <p className="student-email">{student.email}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timetable */}
          {activeMenu === 'timetable' && (
            <div className="timetable-section">
              <h2>📅 Complete Timetable</h2>
              <p className="section-subtitle">Your weekly class schedule (both online and offline)</p>
              
              {timetableLoading ? (
                <div className="loading-spinner">Loading timetable...</div>
              ) : (
                <>
                  {/* Offline Classes Timetable */}
                  {myTimetable.length === 0 ? (
                    <div className="empty-state">
                      <span className="empty-icon">📅</span>
                      <h3>No Timetable Yet</h3>
                      <p>Your schedule will appear here once classes are scheduled</p>
                    </div>
                  ) : (
                    <div className="timetable-view">
                      <h3>📖 Offline Classes</h3>
                      <div className="timetable-table">
                        <table className="timetable">
                          <thead>
                            <tr>
                              <th>Day</th>
                              <th>Time</th>
                              <th>Subject</th>
                              <th>Teacher</th>
                              <th>Room</th>
                              <th>Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {myTimetable.map(cls => (
                              <tr key={cls.id}>
                                <td><strong>{cls.dayOfWeek}</strong></td>
                                <td>{cls.startTime} - {cls.endTime}</td>
                                <td>{cls.subject}</td>
                                <td>{cls.Teacher?.facultyName}</td>
                                <td>{cls.roomNumber || 'TBA'}</td>
                                <td><span className={`type-badge ${cls.classType}`}>{cls.classType}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Online Classes */}
                  {upcomingClasses.length > 0 && (
                    <div className="timetable-view">
                      <h3>🎥 Upcoming Online Classes</h3>
                      <div className="online-classes-list">
                        {upcomingClasses.map(cls => (
                          <div key={cls.id} className="online-class-item">
                            <div className="class-time">
                              {new Date(cls.scheduledDate).toLocaleDateString()} at {new Date(cls.scheduledDate).toLocaleTimeString()}
                            </div>
                            <div className="class-details">
                              <h4>{cls.className}</h4>
                              <p>👨‍🏫 {cls.Teacher?.facultyName}</p>
                              <p>⏱️ {cls.duration} minutes</p>
                            </div>
                            <span className={`status-badge ${cls.status}`}>
                              {cls.status === 'ongoing' ? '🔴 LIVE' : '⏰ Scheduled'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Assignments */}
          {activeMenu === 'assignments' && (
            <div className="assignments-section">
              <div className="section-header">
                <h2>📝 Assignments</h2>
                <p>Download, complete, and submit your assignments</p>
              </div>

              {assignments.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📝</span>
                  <h3>No Assignments</h3>
                  <p>You're all caught up! No pending assignments.</p>
                </div>
              ) : (
                <div className="assignments-list">
                  {assignments.map(assignment => {
                    const isOverdue = new Date(assignment.dueDate) < new Date();
                    const submission = assignment.submissions?.find(s => s.studentId === user.id);
                    
                    return (
                      <div key={assignment.id} className="assignment-card" style={{
                        borderLeft: submission ? '4px solid #10b981' : isOverdue ? '4px solid #ef4444' : '4px solid #3b82f6'
                      }}>
                        <div className="assignment-header">
                          <div>
                            <h3>{assignment.title}</h3>
                            <p className="assignment-course" style={{color: '#64748b', margin: '5px 0'}}>
                              By: {assignment.teacherName || 'Teacher'}
                            </p>
                          </div>
                          <span className={`assignment-status ${submission ? 'submitted' : isOverdue ? 'overdue' : 'pending'}`}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '13px',
                              fontWeight: '600',
                              background: submission ? '#dcfce7' : isOverdue ? '#fee2e2' : '#fef3c7',
                              color: submission ? '#166534' : isOverdue ? '#991b1b' : '#92400e'
                            }}>
                            {submission ? '✓ Submitted' : isOverdue ? '⚠️ Overdue' : '⏳ Pending'}
                          </span>
                        </div>
                        
                        <div className="assignment-details" style={{margin: '15px 0'}}>
                          <p style={{color: '#475569', marginBottom: '10px'}}>{assignment.description}</p>
                          
                          <div className="detail-item" style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                              <span className="detail-icon">📅</span>
                              <span>Due: {new Date(assignment.dueDate).toLocaleString()}</span>
                            </div>
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                              <span className="detail-icon">📊</span>
                              <span>Max Marks: {assignment.maxMarks}</span>
                            </div>
                            {submission && submission.marks !== null && (
                              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <span className="detail-icon">✍️</span>
                                <span style={{fontWeight: 'bold', color: '#059669'}}>
                                  Your Score: {submission.marks}/{assignment.maxMarks}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center'}}>
                          {/* Download Assignment Button */}
                          {assignment.filePath && (
                            <a
                              href={`http://localhost:5000${assignment.filePath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary"
                              style={{
                                textDecoration: 'none',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                            >
                              📥 Download Assignment
                            </a>
                          )}

                          {/* View Submitted File */}
                          {submission && submission.filePath && (
                            <a
                              href={`http://localhost:5000${submission.filePath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary"
                              style={{
                                textDecoration: 'none',
                                padding: '10px 20px',
                                borderRadius: '8px',
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '14px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                            >
                              👁️ View Submission
                            </a>
                          )}

                          {/* Submit Assignment Section */}
                          {!submission && !isOverdue && (
                            <div style={{display: 'flex', gap: '10px', alignItems: 'center', flex: 1}}>
                              <input
                                type="file"
                                id={`submission-file-${assignment.id}`}
                                accept=".pdf,.doc,.docx"
                                onChange={(e) => setSubmissionFile(e.target.files[0])}
                                style={{
                                  padding: '8px',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  fontSize: '14px',
                                  flex: 1
                                }}
                              />
                              <button
                                className="btn btn-primary"
                                onClick={() => handleSubmitAssignment(assignment.id)}
                                style={{
                                  padding: '10px 20px',
                                  borderRadius: '8px',
                                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                  color: 'white',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  fontWeight: '600',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                📤 Submit
                              </button>
                            </div>
                          )}

                          {/* Marks Display */}
                          {submission && (
                            <div style={{
                              marginLeft: 'auto',
                              padding: '10px 20px',
                              background: submission.marks !== null ? '#dcfce7' : '#fef3c7',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '600'
                            }}>
                              {submission.marks !== null ? (
                                <span style={{color: '#166534'}}>
                                  ✅ Graded: {submission.marks}/{assignment.maxMarks}
                                </span>
                              ) : (
                                <span style={{color: '#92400e'}}>
                                  ⏳ Awaiting Grade
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Submission Info */}
                        {submission && (
                          <div style={{
                            marginTop: '15px',
                            padding: '12px',
                            background: '#f1f5f9',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: '#64748b'
                          }}>
                            <strong>Submitted on:</strong> {new Date(submission.submittedAt).toLocaleString()}
                            {submission.feedback && (
                              <div style={{marginTop: '5px'}}>
                                <strong>Teacher Feedback:</strong> {submission.feedback}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Attendance */}
          {activeMenu === 'attendance' && (
            <div className="attendance-section">
              {attendanceData.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📈</span>
                  <h3>No Attendance Data</h3>
                  <p>Attendance records will appear here once teachers start marking attendance for live classes.</p>
                </div>
              ) : (
                <>
                  <div className="attendance-header">
                    <div className="attendance-overall">
                      <div className="attendance-circle">
                        <svg viewBox="0 0 36 36" className="circular-chart">
                          <path className="circle-bg"
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path className="circle"
                            strokeDasharray={`${overallAttendance}, 100`}
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <text x="18" y="20.35" className="percentage">{overallAttendance}%</text>
                        </svg>
                      </div>
                      <div>
                        <h2>Overall Attendance</h2>
                        <p>Based on last 5 months</p>
                      </div>
                    </div>
                  </div>

                  <div className="attendance-graph">
                    <h3>📊 Monthly Attendance</h3>
                    <div className="bar-chart">
                      {attendanceData.map((data, index) => (
                        <div key={index} className="bar-item">
                          <div className="bar-container">
                            <div 
                              className="bar-fill"
                              style={{ height: `${data.percentage}%` }}
                            >
                              <span className="bar-value">{data.percentage}%</span>
                        </div>
                      </div>
                      <span className="bar-label">{data.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="attendance-details">
                <h3>📋 Attendance Details</h3>
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Classes Attended</th>
                      <th>Total Classes</th>
                      <th>Percentage</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.map((data, index) => {
                      const attended = Math.round((data.percentage / 100) * 20);
                      return (
                        <tr key={index}>
                          <td>{data.month}</td>
                          <td>{attended}</td>
                          <td>20</td>
                          <td>{data.percentage}%</td>
                          <td>
                            <span className={`status-tag ${data.percentage >= 75 ? 'good' : 'warning'}`}>
                              {data.percentage >= 75 ? '✓ Good' : '⚠ Low'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
                </>
              )}
            </div>
          )}

          {/* Notifications */}
          {activeMenu === 'notifications' && (
            <div className="notifications-section">
              <div className="section-header">
                <h2>🔔 Notifications</h2>
                {notifications.length > 0 && (
                  <button 
                    className="btn-link"
                    onClick={() => setNotifications(notifications.map(n => ({ ...n, isRead: true })))}
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🔔</span>
                  <h3>No Notifications</h3>
                  <p>You're all caught up! New notifications will appear here.</p>
                </div>
              ) : (
                <div className="notifications-list">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`notification-card ${notification.isRead ? 'read' : 'unread'}`}
                      onClick={() => markNotificationRead(notification.id)}
                    >
                      <div className={`notification-icon ${notification.type}`}>
                        {notification.type === 'assignment' && '📝'}
                        {notification.type === 'class' && '🎥'}
                        {notification.type === 'grade' && '📊'}
                      </div>
                      <div className="notification-content">
                        <h4>{notification.title}</h4>
                        <p>{notification.message}</p>
                        <span className="notification-time">{notification.time}</span>
                      </div>
                      {!notification.isRead && <div className="unread-indicator"></div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {activeMenu === 'messages' && (
            <Messages />
          )}

          {/* Student Tools */}
          {activeMenu === 'student-tools' && (
            <div className="student-tools-container">
              <div className="tools-header">
                <h2>🛠️ Student Tools</h2>
                <p>Click on any tool below to expand and use it</p>
              </div>

              <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Write Notes Tool */}
                <div style={{ marginBottom: '20px', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <div 
                    onClick={() => toggleToolExpanded('notes')}
                    style={{
                      padding: '20px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span style={{ fontSize: '32px' }}>📝</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '20px' }}>Write Notes</h3>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.9 }}>Create and manage your study notes</p>
                      </div>
                    </div>
                    <span style={{ fontSize: '24px' }}>{toolsExpanded.notes ? '▼' : '▶'}</span>
                  </div>
                  {toolsExpanded.notes && (
                    <div style={{ padding: '25px' }}>
                      <div style={{ marginBottom: '25px' }}>
                        <input 
                          type="text"
                          placeholder="Note title..."
                          value={currentNote.title}
                          onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '16px',
                            marginBottom: '15px'
                          }}
                        />
                        <textarea 
                          placeholder="Write your notes here..."
                          value={currentNote.content}
                          onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })}
                          style={{
                            width: '100%',
                            minHeight: '200px',
                            padding: '12px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '15px',
                            resize: 'vertical',
                            fontFamily: 'inherit'
                          }}
                        />
                        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                          <button 
                            onClick={handleSaveNote}
                            style={{
                              padding: '10px 20px',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '15px',
                              fontWeight: '600'
                            }}
                          >
                            {editingNoteId ? '💾 Update Note' : '💾 Save Note'}
                          </button>
                          {editingNoteId && (
                            <button 
                              onClick={() => { setEditingNoteId(null); setCurrentNote({ title: '', content: '' }); }}
                              style={{
                                padding: '10px 20px',
                                background: '#64748b',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '15px'
                              }}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                      <h4 style={{ marginBottom: '15px', color: '#1e293b' }}>Your Notes ({notes.length})</h4>
                      <div style={{ display: 'grid', gap: '15px', maxHeight: '400px', overflowY: 'auto' }}>
                        {notes.length === 0 ? (
                          <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '20px' }}>
                            No notes yet. Create your first note above!
                          </p>
                        ) : (
                          notes.map(note => (
                            <div key={note.id} style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <h5 style={{ margin: '0 0 10px 0', color: '#1e293b' }}>{note.title}</h5>
                              <p style={{ margin: '0 0 10px 0', color: '#475569', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                                {note.content.substring(0, 150)}{note.content.length > 150 && '...'}
                              </p>
                              <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: '#64748b' }}>
                                <button onClick={() => handleEditNote(note)} style={{ padding: '5px 12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✏️ Edit</button>
                                <button onClick={() => handleDeleteNote(note.id)} style={{ padding: '5px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️ Delete</button>
                                <span style={{ marginLeft: 'auto', alignSelf: 'center' }}>{new Date(note.updatedAt).toLocaleString()}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Todo List Tool */}
                <div style={{ marginBottom: '20px', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <div 
                    onClick={() => toggleToolExpanded('todos')}
                    style={{
                      padding: '20px',
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span style={{ fontSize: '32px' }}>✅</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '20px' }}>Todo List</h3>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.9 }}>Track your tasks and assignments</p>
                      </div>
                    </div>
                    <span style={{ fontSize: '24px' }}>{toolsExpanded.todos ? '▼' : '▶'}</span>
                  </div>
                  {toolsExpanded.todos && (
                    <div style={{ padding: '25px' }}>
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                        <input 
                          type="text"
                          placeholder="Add a new task..."
                          id="todoInputNew"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && e.target.value.trim()) {
                              addTodoAPI(e.target.value);
                              e.target.value = '';
                            }
                          }}
                          style={{
                            flex: 1,
                            padding: '12px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '15px'
                          }}
                        />
                        <button 
                          onClick={() => {
                            const input = document.getElementById('todoInputNew');
                            if (input.value.trim()) {
                              addTodoAPI(input.value);
                              input.value = '';
                            }
                          }}
                          style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '18px',
                            fontWeight: 'bold'
                          }}
                        >
                          +
                        </button>
                      </div>
                      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {todos.length === 0 ? (
                          <p style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', padding: '20px' }}>
                            No tasks yet. Add one above!
                          </p>
                        ) : (
                          todos.map(todo => (
                            <div key={todo.id} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '15px', 
                              padding: '15px', 
                              background: todo.done ? '#f0fdf4' : '#fefce8', 
                              borderRadius: '8px', 
                              marginBottom: '10px',
                              border: '2px solid ' + (todo.done ? '#bbf7d0' : '#fef08a')
                            }}>
                              <input 
                                type="checkbox" 
                                checked={todo.done}
                                onChange={() => toggleTodoAPI(todo.id, todo.done)}
                                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                              />
                              <span style={{ 
                                flex: 1, 
                                fontSize: '15px', 
                                textDecoration: todo.done ? 'line-through' : 'none',
                                color: todo.done ? '#16a34a' : '#1e293b'
                              }}>
                                {todo.text}
                              </span>
                              <button 
                                onClick={() => deleteTodoAPI(todo.id)}
                                style={{
                                  padding: '8px 12px',
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Chat Bot Tool */}
                <div style={{ marginBottom: '20px', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <div 
                    onClick={() => toggleToolExpanded('aiChat')}
                    style={{
                      padding: '20px',
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span style={{ fontSize: '32px' }}>🤖</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '20px' }}>AI Chat Bot</h3>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.9 }}>Ask questions and get instant AI-powered answers</p>
                      </div>
                    </div>
                    <span style={{ fontSize: '24px' }}>{toolsExpanded.aiChat ? '▼' : '▶'}</span>
                  </div>
                  {toolsExpanded.aiChat && (
                    <div style={{ padding: '25px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h4 style={{ margin: 0, color: '#1e293b' }}>Chat with AI Assistant</h4>
                        {aiMessages.length > 0 && (
                          <button 
                            onClick={handleClearAIChat}
                            style={{
                              padding: '8px 16px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '13px'
                            }}
                          >
                            🗑️ Clear Chat
                          </button>
                        )}
                      </div>
                      <div style={{ 
                        height: '400px', 
                        overflowY: 'auto', 
                        background: '#f8fafc', 
                        borderRadius: '8px', 
                        padding: '20px',
                        marginBottom: '15px'
                      }}>
                        {aiMessages.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '50px 20px', color: '#64748b' }}>
                            <p style={{ fontSize: '48px', margin: '0 0 15px 0' }}>🤖</p>
                            <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>Hello! I'm your AI Study Assistant</p>
                            <p style={{ fontSize: '14px', margin: 0 }}>Ask me anything about your studies, homework, or concepts you're learning!</p>
                          </div>
                        ) : (
                          aiMessages.map((msg, idx) => (
                            <div key={idx} style={{ 
                              display: 'flex', 
                              gap: '12px', 
                              marginBottom: '20px',
                              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                            }}>
                              <span style={{ fontSize: '28px', flexShrink: 0 }}>{msg.role === 'user' ? '👤' : '🤖'}</span>
                              <div style={{ 
                                background: msg.role === 'user' ? '#3b82f6' : 'white', 
                                color: msg.role === 'user' ? 'white' : '#1e293b',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                maxWidth: '70%',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                whiteSpace: 'pre-wrap',
                                lineHeight: '1.6'
                              }}>
                                {msg.message}
                              </div>
                            </div>
                          ))
                        )}
                        <div ref={aiMessagesEndRef} />
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                          type="text"
                          placeholder="Ask me anything..."
                          value={aiInput}
                          onChange={(e) => setAiInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !aiLoading) {
                              handleSendAIMessage();
                            }
                          }}
                          disabled={aiLoading}
                          style={{
                            flex: 1,
                            padding: '12px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '15px'
                          }}
                        />
                        <button 
                          onClick={handleSendAIMessage}
                          disabled={aiLoading}
                          style={{
                            padding: '12px 24px',
                            background: aiLoading ? '#94a3b8' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: aiLoading ? 'not-allowed' : 'pointer',
                            fontSize: '15px',
                            fontWeight: '600'
                          }}
                        >
                          {aiLoading ? '⏳ Thinking...' : '📤 Send'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat with Classmates Tool */}
                <div style={{ marginBottom: '20px', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                  <div 
                    onClick={() => toggleToolExpanded('classmateChat')}
                    style={{
                      padding: '20px',
                      background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span style={{ fontSize: '32px' }}>💬</span>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '20px' }}>Chat with Classmates</h3>
                        <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.9 }}>Send text and voice messages to your class</p>
                      </div>
                    </div>
                    <span style={{ fontSize: '24px' }}>{toolsExpanded.classmateChat ? '▼' : '▶'}</span>
                  </div>
                  {toolsExpanded.classmateChat && (
                    <div style={{ padding: '25px' }}>
                      {mySections.length === 0 ? (
                        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 20px', fontStyle: 'italic' }}>
                          You are not enrolled in any section yet. Join a section to chat with classmates!
                        </p>
                      ) : (
                        <>
                          <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e293b' }}>Select Section</label>
                            <select 
                              value={selectedChatSection || ''}
                              onChange={(e) => {
                                setSelectedChatSection(parseInt(e.target.value));
                                loadClassmateChat();
                              }}
                              style={{
                                width: '100%',
                                padding: '12px',
                                border: '2px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '15px'
                              }}
                            >
                              <option value="">Choose a section...</option>
                              {mySections.map(section => (
                                <option key={section.id} value={section.id}>
                                  {section.sectionName} - {section.courseName}
                                </option>
                              ))}
                            </select>
                          </div>

                          {selectedChatSection && (
                            <>
                              <div style={{ 
                                height: '400px', 
                                overflowY: 'auto', 
                                background: '#f8fafc', 
                                borderRadius: '8px', 
                                padding: '20px',
                                marginBottom: '15px'
                              }}>
                                {classmateMessages.filter(m => m.sectionId === selectedChatSection).length === 0 ? (
                                  <p style={{ textAlign: 'center', color: '#94a3b8', padding: '50px 20px', fontStyle: 'italic' }}>
                                    No messages yet. Start the conversation!
                                  </p>
                                ) : (
                                  classmateMessages
                                    .filter(m => m.sectionId === selectedChatSection)
                                    .map((msg) => (
                                      <div key={msg.id} style={{ 
                                        marginBottom: '20px',
                                        display: 'flex',
                                        flexDirection: msg.studentId === user.id ? 'row-reverse' : 'row',
                                        gap: '12px'
                                      }}>
                                        <div style={{
                                          background: msg.studentId === user.id ? '#3b82f6' : 'white',
                                          color: msg.studentId === user.id ? 'white' : '#1e293b',
                                          padding: '12px 16px',
                                          borderRadius: '12px',
                                          maxWidth: '70%',
                                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}>
                                          <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '5px', opacity: 0.8 }}>
                                            {msg.Student?.fullName || 'Unknown'}
                                          </div>
                                          {msg.messageType === 'voice' ? (
                                            <div>
                                              <audio controls style={{ width: '100%', maxWidth: '250px' }}>
                                                <source src={`http://localhost:5000${msg.voiceUrl}`} type="audio/webm" />
                                              </audio>
                                              <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.7 }}>
                                                🎤 Voice message ({msg.voiceDuration}s)
                                              </div>
                                            </div>
                                          ) : (
                                            <div>{msg.message}</div>
                                          )}
                                          <div style={{ fontSize: '11px', marginTop: '5px', opacity: 0.7 }}>
                                            {new Date(msg.createdAt).toLocaleTimeString()}
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                )}
                                <div ref={classmateMessagesEndRef} />
                              </div>

                              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                <input 
                                  type="text"
                                  placeholder="Type your message..."
                                  value={classmateInput}
                                  onChange={(e) => setClassmateInput(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      handleSendClassmateMessage();
                                    }
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '12px',
                                    border: '2px solid #e2e8f0',
                                    borderRadius: '8px',
                                    fontSize: '15px'
                                  }}
                                />
                                <button 
                                  onClick={handleSendClassmateMessage}
                                  style={{
                                    padding: '12px 24px',
                                    background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '15px',
                                    fontWeight: '600'
                                  }}
                                >
                                  📤 Send
                                </button>
                              </div>

                              <div style={{ textAlign: 'center' }}>
                                {!isRecording ? (
                                  <button 
                                    onClick={handleStartRecording}
                                    style={{
                                      padding: '12px 24px',
                                      background: '#10b981',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '8px',
                                      cursor: 'pointer',
                                      fontSize: '15px',
                                      fontWeight: '600'
                                    }}
                                  >
                                    🎤 Start Voice Recording
                                  </button>
                                ) : (
                                  <div>
                                    <div style={{ marginBottom: '10px', color: '#ef4444', fontWeight: '600' }}>
                                      🔴 Recording... {recordingDuration}s
                                    </div>
                                    <button 
                                      onClick={handleStopRecording}
                                      style={{
                                        padding: '12px 24px',
                                        background: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '15px',
                                        fontWeight: '600'
                                      }}
                                    >
                                      ⏹ Stop & Send
                                    </button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'exams' && (
            <div className="content-section">
              <div className="section-header">
                <h2>📋 Exams</h2>
                <p>View and take your quizzes, tests, and final exams</p>
              </div>

              {/* Exam Type Tabs */}
              <div style={{
                display: 'flex',
                gap: '15px',
                marginBottom: '30px',
                borderBottom: '2px solid #e2e8f0',
                paddingBottom: '10px'
              }}>
                <button
                  onClick={() => setExamType('quizzes')}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    background: examType === 'quizzes' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                    color: examType === 'quizzes' ? 'white' : '#64748b',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                >
                  📝 Quiz / Test
                </button>
                <button
                  onClick={() => setExamType('finals')}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    background: examType === 'finals' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 'transparent',
                    color: examType === 'finals' ? 'white' : '#64748b',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease'
                  }}
                >
                  🎓 Final Exam
                </button>
              </div>

              {/* Quiz/Test Section (Teacher Scheduled) */}
              {examType === 'quizzes' && (
                <div>
                  <div style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '20px',
                    borderRadius: '12px',
                    color: 'white',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ margin: '0 0 10px 0', color: 'white' }}>📝 Quizzes & Tests</h3>
                    <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                      These are short quizzes and tests scheduled by your teachers
                    </p>
                  </div>
                  <StudentExams user={user} examFilter="teacher" />
                </div>
              )}

              {/* Final Exam Section (Admin Scheduled) */}
              {examType === 'finals' && (
                <div>
                  <div style={{
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    padding: '20px',
                    borderRadius: '12px',
                    color: 'white',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ margin: '0 0 10px 0', color: 'white' }}>🎓 Final Exams</h3>
                    <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                      These are major exams scheduled by administration for evaluation
                    </p>
                  </div>
                  <StudentExams user={user} examFilter="admin" />
                </div>
              )}
            </div>
          )}

          {/* My Results */}
          {activeMenu === 'results' && (
            <div className="content-section">
              <div className="section-header">
                <h2>📊 My Published Results</h2>
                <p>View your exam results that have been published by your instructors</p>
              </div>

              {myResults.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3>No Published Results</h3>
                  <p>Your exam results will appear here once they are published by your instructors.</p>
                </div>
              ) : (
                <div className="results-grid">
                  {myResults.map((result) => {
                    const exam = result.exam || result.OnlineExam;
                    const score = result.marksObtained || result.totalScore || 0;
                    const percentage = exam.totalMarks > 0 ? ((score / exam.totalMarks) * 100).toFixed(2) : 0;
                    const isPassed = percentage >= 60;
                    
                    return (
                      <div key={result.id} className="result-card">
                        <div className="result-header">
                          <h3>{exam.examTitle}</h3>
                          <span className={`result-badge ${isPassed ? 'pass' : 'fail'}`}>
                            {isPassed ? '✓ Pass' : '✗ Fail'}
                          </span>
                        </div>
                        
                        <div className="result-details">
                          <div className="result-score">
                            <div className="score-circle" style={{
                              background: `conic-gradient(${isPassed ? '#10b981' : '#ef4444'} ${percentage * 3.6}deg, #e5e7eb 0deg)`
                            }}>
                              <div className="score-inner">
                                <span className="score-value">{percentage}%</span>
                              </div>
                            </div>
                            <div className="score-info">
                              <p className="score-text">
                                <strong>{score}</strong> out of <strong>{exam.totalMarks}</strong>
                              </p>
                            </div>
                          </div>

                          <div className="result-info">
                            <div className="info-row">
                              <span className="info-label">👨‍🏫 Instructor:</span>
                              <span className="info-value">{exam.teacher?.facultyName || 'Not Available'}</span>
                            </div>
                            <div className="info-row">
                              <span className="info-label">📅 Exam Date:</span>
                              <span className="info-value">
                                {new Date(exam.examDate).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="info-row">
                              <span className="info-label">📝 Submitted:</span>
                              <span className="info-value">
                                {new Date(result.submittedAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="info-row">
                              <span className="info-label">📢 Published:</span>
                              <span className="info-value">
                                {new Date(exam.publishedAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Fee Status */}
          {activeMenu === 'fee-status' && (
            <div className="fee-status-section">
              <div className="section-header">
                <h2>💰 Fee Status</h2>
                <p>View and manage your fee payments</p>
              </div>

              {feeLoading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading fee details...</p>
                </div>
              ) : myFees.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">💰</span>
                  <h3>No Fee Records</h3>
                  <p>Your fee details will appear here once added by the admin.</p>
                </div>
              ) : (
                <>
                  {/* Fee Summary Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    {myFees.map(fee => {
                      const isPaid = fee.status === 'paid';
                      const isPartial = fee.status === 'partial';
                      const isPending = fee.status === 'pending';
                      const isOverdue = new Date(fee.dueDate) < new Date() && !isPaid;

                      return (
                        <div 
                          key={fee.id} 
                          className="stat-card"
                          style={{
                            background: isPaid ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 
                                       isOverdue ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
                                       isPartial ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' :
                                       'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: 'white'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                            <div>
                              <h4 style={{ margin: 0, fontSize: '14px', opacity: 0.9, color: 'white' }}>
                                {fee.semester} - {fee.academicYear}
                              </h4>
                              <p style={{ margin: '4px 0 0 0', fontSize: '28px', fontWeight: 'bold', color: 'white' }}>
                                ₹{fee.totalFee.toLocaleString()}
                              </p>
                            </div>
                            <span style={{ fontSize: '32px' }}>
                              {isPaid ? '✅' : isOverdue ? '⚠️' : isPartial ? '⏳' : '📋'}
                            </span>
                          </div>
                          <div style={{ 
                            padding: '8px 12px', 
                            background: 'rgba(255,255,255,0.2)', 
                            borderRadius: '6px',
                            fontSize: '13px',
                            marginBottom: '8px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span>Paid:</span>
                              <strong>₹{fee.paidAmount.toLocaleString()}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Pending:</span>
                              <strong>₹{fee.pendingAmount.toLocaleString()}</strong>
                            </div>
                          </div>
                          <div style={{ fontSize: '12px', opacity: 0.9 }}>
                            <strong>Due:</strong> {new Date(fee.dueDate).toLocaleDateString()}
                          </div>
                          <div style={{ 
                            marginTop: '8px', 
                            padding: '4px 8px', 
                            background: 'rgba(255,255,255,0.25)', 
                            borderRadius: '4px',
                            textAlign: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase'
                          }}>
                            {fee.status}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Detailed Fee Breakdown */}
                  {myFees.map(fee => (
                    <div key={fee.id} className="form-card" style={{ marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, color: '#1e40af' }}>
                          📊 Fee Breakdown - {fee.semester} ({fee.academicYear})
                        </h3>
                        {fee.status !== 'paid' && (
                          <button
                            onClick={() => handlePayFee(fee)}
                            style={{
                              padding: '10px 20px',
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                            }}
                          >
                            💳 Pay Now (₹{fee.pendingAmount.toLocaleString()})
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                        <div style={{ padding: '15px', background: '#f0f9ff', borderRadius: '8px', border: '2px solid #bfdbfe' }}>
                          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Tuition Fee</div>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>₹{fee.tuitionFee.toLocaleString()}</div>
                        </div>
                        <div style={{ padding: '15px', background: '#f0f9ff', borderRadius: '8px', border: '2px solid #bfdbfe' }}>
                          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Exam Fee</div>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>₹{fee.examFee.toLocaleString()}</div>
                        </div>
                        <div style={{ padding: '15px', background: '#f0f9ff', borderRadius: '8px', border: '2px solid #bfdbfe' }}>
                          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Library Fee</div>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>₹{fee.libraryFee.toLocaleString()}</div>
                        </div>
                        <div style={{ padding: '15px', background: '#f0f9ff', borderRadius: '8px', border: '2px solid #bfdbfe' }}>
                          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Lab Fee</div>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>₹{fee.labFee.toLocaleString()}</div>
                        </div>
                        <div style={{ padding: '15px', background: '#f0f9ff', borderRadius: '8px', border: '2px solid #bfdbfe' }}>
                          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Other Charges</div>
                          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>₹{fee.otherCharges.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Payment History */}
                  {myPayments.length > 0 && (
                    <div className="form-card">
                      <h3 style={{ marginBottom: '20px', color: '#1e40af' }}>💳 Payment History</h3>
                      <div className="table-container">
                        <table className="styled-table">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Amount</th>
                              <th>Method</th>
                              <th>Transaction ID</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {myPayments.map(payment => (
                              <tr key={payment.id}>
                                <td>{new Date(payment.paymentDate).toLocaleDateString()}</td>
                                <td><strong>₹{payment.amount.toLocaleString()}</strong></td>
                                <td>{payment.paymentMethod}</td>
                                <td>{payment.transactionId || 'N/A'}</td>
                                <td>
                                  <span style={{
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    background: payment.status === 'verified' ? '#dcfce7' : '#fef3c7',
                                    color: payment.status === 'verified' ? '#166534' : '#92400e'
                                  }}>
                                    {payment.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Fee Query Form */}
                  <div className="form-card" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)' }}>
                    <h3 style={{ marginBottom: '20px', color: '#1e40af' }}>❓ Have a Question About Fees?</h3>
                    <form onSubmit={handleSubmitFeeQuery}>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e40af' }}>
                          Subject
                        </label>
                        <input
                          type="text"
                          value={feeQueryForm.subject}
                          onChange={(e) => setFeeQueryForm({...feeQueryForm, subject: e.target.value})}
                          placeholder="e.g., Payment Verification Issue"
                          required
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid #bfdbfe',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e40af' }}>
                          Message
                        </label>
                        <textarea
                          value={feeQueryForm.message}
                          onChange={(e) => setFeeQueryForm({...feeQueryForm, message: e.target.value})}
                          placeholder="Describe your question or concern..."
                          required
                          rows="4"
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid #bfdbfe',
                            borderRadius: '8px',
                            fontSize: '14px',
                            resize: 'vertical'
                          }}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        style={{
                          padding: '12px 24px',
                          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          opacity: loading ? 0.6 : 1
                        }}
                      >
                        {loading ? 'Submitting...' : '📤 Submit Query'}
                      </button>
                    </form>
                  </div>
                </>
              )}

              {/* Payment Modal */}
              {showPaymentModal && selectedFee && (
                <div style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1000
                }}>
                  <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '30px',
                    maxWidth: '500px',
                    width: '90%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ margin: 0, color: '#1e40af' }}>💳 Pay Fee Online</h3>
                      <button
                        onClick={() => setShowPaymentModal(false)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '24px',
                          cursor: 'pointer',
                          color: '#64748b'
                        }}
                      >
                        ×
                      </button>
                    </div>

                    <div style={{ padding: '15px', background: '#f0f9ff', borderRadius: '8px', marginBottom: '20px' }}>
                      <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                        {selectedFee.semester} - {selectedFee.academicYear}
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af' }}>
                        ₹{selectedFee.pendingAmount.toLocaleString()}
                      </div>
                    </div>

                    <form onSubmit={handlePaymentSubmit}>
                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e40af' }}>
                          Payment Method
                        </label>
                        <select
                          value={paymentForm.paymentMethod}
                          onChange={(e) => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid #bfdbfe',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                        >
                          <option value="upi">📱 UPI (PhonePe, Google Pay, Paytm)</option>
                          <option value="netbanking">🏦 Net Banking</option>
                          <option value="card">💳 Debit/Credit Card</option>
                          <option value="wallet">👛 Digital Wallet</option>
                        </select>
                      </div>

                      {paymentForm.paymentMethod === 'upi' && (
                        <div style={{ marginBottom: '15px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e40af' }}>
                            UPI ID
                          </label>
                          <input
                            type="text"
                            value={paymentForm.upiId}
                            onChange={(e) => setPaymentForm({...paymentForm, upiId: e.target.value})}
                            placeholder="yourname@paytm"
                            required
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: '2px solid #bfdbfe',
                              borderRadius: '8px',
                              fontSize: '14px'
                            }}
                          />
                        </div>
                      )}

                      <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e40af' }}>
                          Amount
                        </label>
                        <input
                          type="number"
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                          placeholder="Enter amount"
                          required
                          min="1"
                          max={selectedFee.pendingAmount}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid #bfdbfe',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                        />
                        <small style={{ color: '#64748b', fontSize: '12px' }}>
                          Max: ₹{selectedFee.pendingAmount.toLocaleString()}
                        </small>
                      </div>

                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#1e40af' }}>
                          Transaction ID (Optional)
                        </label>
                        <input
                          type="text"
                          value={paymentForm.transactionId}
                          onChange={(e) => setPaymentForm({...paymentForm, transactionId: e.target.value})}
                          placeholder="Enter transaction reference number"
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid #bfdbfe',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setShowPaymentModal(false)}
                          style={{
                            flex: 1,
                            padding: '12px',
                            background: '#e2e8f0',
                            color: '#475569',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          style={{
                            flex: 1,
                            padding: '12px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.6 : 1
                          }}
                        >
                          {loading ? 'Processing...' : '✓ Pay Now'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Settings */}
          {activeMenu === 'settings' && (
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
                <p className="section-description">Manage your student account</p>
                
                <div className="account-info">
                  <div className="info-row">
                    <span className="info-label">Student ID:</span>
                    <span className="info-value">{user?.studentId || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Name:</span>
                    <span className="info-value">{user?.fullName}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{user?.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Access Key:</span>
                    <span className="info-value">{user?.accessKey || 'N/A'}</span>
                  </div>
                </div>

                <button className="logout-btn-settings" onClick={logout}>
                  <span>🚪</span> Logout from Account
                </button>
              </div>
            </div>
          )}

          {/* My Feedback Section */}
          {activeMenu === 'my-feedback' && (
            <div className="feedback-section">
              <div className="section-header">
                <h2>💬 My Feedback</h2>
                <p>View feedback from your teachers</p>
              </div>

              {feedbackLoading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading feedback...</p>
                </div>
              ) : myFeedback.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">💬</span>
                  <h3>No Feedback Yet</h3>
                  <p>Your teachers haven't provided any feedback yet. Keep up the good work!</p>
                </div>
              ) : (
                <div className="feedback-list">
                  {myFeedback.map(feedback => (
                    <div key={feedback.id} className="feedback-card">
                      <div className="feedback-header">
                        <div className="feedback-teacher">
                          <div className="teacher-avatar">
                            👨‍🏫
                          </div>
                          <div>
                            <h4>{feedback.Teacher?.facultyName || 'Teacher'}</h4>
                            <p className="feedback-date">
                              {new Date(feedback.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
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
                              <span 
                                key={star} 
                                className={`star ${star <= feedback.rating ? 'filled' : ''}`}
                              >
                                ⭐
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Profile Modal */}
      {showProfile && (
        <StudentProfile 
          user={user} 
          onClose={() => setShowProfile(false)}
          onUpdate={handleProfileUpdate}
        />
      )}

      {/* ID Card Generator Modal */}
      {showIDCard && (
        <IDCardGenerator 
          user={user} 
          onClose={() => setShowIDCard(false)}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
