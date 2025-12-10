import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { liveClassService, assignmentService, courseService, notificationService } from '../services/api';
import Messages from '../components/Messages';
import StudentProfile from '../components/StudentProfile';
import StudentChat from '../components/StudentChat';
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
  const [activeMenu, setActiveMenu] = useState('dashboard'); // dashboard, courses, assignments, attendance, notifications, live-classes, messages, chat
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    loadClasses();
    loadEnrolledCourses();
    loadAssignments();
    loadNotifications();
    loadAttendanceData();
    
    const interval = setInterval(() => {
      loadClasses();
      loadNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const loadEnrolledCourses = async () => {
    try {
      const res = await courseService.getAllCourses();
      if (res.data.success && res.data.courses) {
        const coursesWithProgress = res.data.courses.map(course => ({
          ...course,
          progress: Math.floor(Math.random() * 100), // TODO: Implement actual progress tracking
          rating: 4.5, // TODO: Implement rating system
          completedLessons: Math.floor(Math.random() * (course.totalLessons || 10))
        }));
        setEnrolledCourses(coursesWithProgress);
      }
    } catch (err) {
      console.error('Error loading courses:', err);
      // Fallback to mock data
      setEnrolledCourses([]);
    }
  };

  const loadAssignments = async () => {
    try {
      const res = await assignmentService.getAllAssignments();
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error('Error loading assignments:', err);
      // Fallback to mock data if API fails
      setAssignments([
        {
          id: 1,
          title: 'Project Report - Chapter 1',
          course: 'Web Development Fundamentals',
          dueDate: '2025-12-10',
          status: 'pending',
          fileUrl: '/uploads/assignments/assignment1.pdf',
          fileName: 'assignment1.pdf'
        },
        {
          id: 2,
          title: 'Algorithm Analysis Assignment',
          course: 'Data Structures & Algorithms',
          dueDate: '2025-12-15',
          status: 'pending',
          fileUrl: '/uploads/assignments/assignment2.pdf',
          fileName: 'assignment2.pdf'
        }
      ]);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await notificationService.getMyNotifications();
      if (res.data.success && res.data.notifications) {
        const formattedNotifications = res.data.notifications.map(notif => ({
          id: notif.id,
          title: notif.title,
          message: notif.message,
          time: getTimeAgo(notif.createdAt),
          type: notif.type,
          isRead: notif.isRead
        }));
        setNotifications(formattedNotifications);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      setNotifications([]);
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const loadAttendanceData = async () => {
    try {
      const res = await liveClassService.getMyAttendance();
      if (res.data.success && res.data.attendance) {
        const { monthlyData } = res.data.attendance;
        setAttendanceData(monthlyData || []);
      } else {
        // Fallback to empty data if no attendance records
        setAttendanceData([
          { month: 'Aug', percentage: 0, attended: 0, total: 0 },
          { month: 'Sep', percentage: 0, attended: 0, total: 0 },
          { month: 'Oct', percentage: 0, attended: 0, total: 0 },
          { month: 'Nov', percentage: 0, attended: 0, total: 0 },
          { month: 'Dec', percentage: 0, attended: 0, total: 0 }
        ]);
      }
    } catch (err) {
      console.error('Error loading attendance:', err);
      // Fallback to empty data on error
      setAttendanceData([
        { month: 'Aug', percentage: 0, attended: 0, total: 0 },
        { month: 'Sep', percentage: 0, attended: 0, total: 0 },
        { month: 'Oct', percentage: 0, attended: 0, total: 0 },
        { month: 'Nov', percentage: 0, attended: 0, total: 0 },
        { month: 'Dec', percentage: 0, attended: 0, total: 0 }
      ]);
    }
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
    updateUser({ ...user, ...updatedStudent });
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

          <button 
            className={`nav-item ${activeMenu === 'live-classes' ? 'active' : ''}`}
            onClick={() => setActiveMenu('live-classes')}
          >
            <span className="nav-icon">🎥</span>
            {!sidebarCollapsed && <span>Live Classes</span>}
          </button>

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
            className={`nav-item ${activeMenu === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveMenu('chat')}
          >
            <span className="nav-icon">💬</span>
            {!sidebarCollapsed && <span>Discussion</span>}
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
            className="nav-item logout-btn"
            onClick={logout}
          >
            <span className="nav-icon">🚪</span>
            {!sidebarCollapsed && <span>Logout</span>}
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
                    {selectedCourse.videos && selectedCourse.videos.length > 0 ? (
                      <div className="video-list">
                        {selectedCourse.videos.map(video => (
                          <div key={video.id} className="video-item">
                            <div className="video-icon">▶️</div>
                            <div className="video-info">
                              <h4>{video.title}</h4>
                              <p>Duration: {video.duration}</p>
                              {video.description && <p className="video-desc">{video.description}</p>}
                            </div>
                            <a 
                              href={video.videoUrl}
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

          {/* Assignments */}
          {activeMenu === 'assignments' && (
            <div className="assignments-section">
              <div className="section-header">
                <h2>📝 Assignments</h2>
                <p>Download and complete your assignments</p>
              </div>

              {assignments.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📝</span>
                  <h3>No Assignments</h3>
                  <p>You're all caught up!</p>
                </div>
              ) : (
                <div className="assignments-list">
                  {assignments.map(assignment => (
                    <div key={assignment.id} className="assignment-card">
                      <div className="assignment-header">
                        <div>
                          <h3>{assignment.title}</h3>
                          <p className="assignment-course">{assignment.course}</p>
                        </div>
                        <span className={`assignment-status ${assignment.status}`}>
                          {assignment.status}
                        </span>
                      </div>
                      
                      <div className="assignment-details">
                        <div className="detail-item">
                          <span className="detail-icon">📅</span>
                          <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-icon">📎</span>
                          <span>{assignment.fileName}</span>
                        </div>
                      </div>

                      <button 
                        className="btn btn-primary"
                        onClick={() => handleDownloadAssignment(assignment)}
                      >
                        📥 Download Assignment
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Attendance */}
          {activeMenu === 'attendance' && (
            <div className="attendance-section">
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
                {attendanceData.length === 0 || attendanceData.every(d => d.total === 0) ? (
                  <div className="empty-state" style={{ padding: '40px' }}>
                    <span className="empty-icon">📊</span>
                    <h3>No Attendance Data</h3>
                    <p>Attendance will appear here when teachers mark your attendance in live classes.</p>
                  </div>
                ) : (
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
                )}
              </div>

              <div className="attendance-details">
                <h3>📋 Attendance Details</h3>
                {attendanceData.length === 0 || attendanceData.every(d => d.total === 0) ? (
                  <div className="empty-state" style={{ padding: '40px' }}>
                    <p>No attendance records found. Join live classes to build your attendance history.</p>
                  </div>
                ) : (
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
                        return (
                          <tr key={index}>
                            <td>{data.month}</td>
                            <td>{data.attended || 0}</td>
                            <td>{data.total || 0}</td>
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
                )}
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeMenu === 'notifications' && (
            <div className="notifications-section">
              <div className="section-header">
                <h2>🔔 Notifications</h2>
                <button 
                  className="btn-link"
                  onClick={() => setNotifications(notifications.map(n => ({ ...n, isRead: true })))}
                >
                  Mark all as read
                </button>
              </div>

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
            </div>
          )}

          {/* Messages */}
          {activeMenu === 'messages' && (
            <Messages />
          )}

          {/* Chat/Discussion */}
          {activeMenu === 'chat' && (
            <StudentChat user={user} />
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
    </div>
  );
};

export default StudentDashboard;
