import React from 'react';
import TeacherDashboard_New from './TeacherDashboard_New';

// Import the new comprehensive teacher dashboard with all features
const TeacherDashboard = () => {
  return <TeacherDashboard_New />;
};

export default TeacherDashboard;
  });

  useEffect(() => {
    if (user?.id) {
      loadClasses();
    }
  }, [user]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const res = await liveClassService.getTeacherClasses(user.id);
      setLiveClasses(res.data.liveClasses);
      setLoading(false);
    } catch (err) {
      setError('Failed to load classes');
      setLoading(false);
    }
  };

  const handleStatusChange = async (classId, status) => {
    try {
      await liveClassService.updateStatus(classId, status);
      setJoinMessage('');
      setError('');
      loadClasses();
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const handleJoinClass = async (classId, meetingLink) => {
    try {
      await liveClassService.joinClass(classId);
      setJoinMessage('✅ Joined successfully! Opening meeting...');
      setError('');
      window.open(meetingLink, '_blank');
      setTimeout(() => setJoinMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join class');
    }
  };

  const loadAttendance = async (classId) => {
    try {
      const res = await liveClassService.getAttendance(classId);
      setAttendance(res.data.attendance);
      setSelectedClass(classId);
    } catch (err) {
      alert('Failed to load attendance');
    }
  };

  const markAttendance = async (e) => {
    e.preventDefault();
    if (!selectedClass) {
      alert('Please select a class first');
      return;
    }

    try {
      await liveClassService.markAttendance(selectedClass, studentEmail);
      alert('Attendance marked successfully');
      setStudentEmail('');
      loadAttendance(selectedClass);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      await messageService.sendMessage(messageForm);
      alert('Message sent successfully!');
      setShowSendMessage(false);
      setMessageForm({
        recipientRole: 'student',
        subject: '',
        message: ''
      });
    } catch (err) {
      alert('Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Teacher Dashboard</h1>
            <p>Welcome back, {user?.facultyName}!</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={() => setShowSendMessage(true)} className="btn btn-primary">
              📧 Send Message to Students
            </button>
            <button onClick={logout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {error && <div className="error-message">{error}</div>}
        {joinMessage && <div className="success-message">{joinMessage}</div>}
        
        <div className="dashboard-card">
          <h2>📚 My Assigned Live Classes</h2>
          <p>Classes scheduled by admin for you to teach.</p>
          {liveClasses.length === 0 ? (
            <div className="placeholder-content">
              <p>No live classes assigned yet.</p>
            </div>
          ) : (
            <div className="classes-list">
              {liveClasses.map(liveClass => (
                <div key={liveClass.id} className="class-card">
                  <div className="class-header">
                    <h3>{liveClass.className}</h3>
                    <span className={`status-badge ${liveClass.status}`}>{liveClass.status}</span>
                  </div>
                  <p>{liveClass.description}</p>
                  <div className="class-details">
                    <p><strong>Date:</strong> {new Date(liveClass.scheduledDate).toLocaleString()}</p>
                    <p><strong>Duration:</strong> {liveClass.duration} minutes</p>
                    <p><strong>Students Enrolled:</strong> {liveClass.totalStudents || 0}</p>
                    <p><strong>Students Joined:</strong> {liveClass.joinedStudents?.length || 0}</p>
                    {liveClass.meetingLink && (
                      <p><strong>Meeting Link:</strong> <a href={liveClass.meetingLink} target="_blank" rel="noopener noreferrer">{liveClass.meetingLink}</a></p>
                    )}
                  </div>
                  <div className="button-group">
                    {liveClass.status === 'scheduled' && (
                      <button 
                        className="btn btn-primary"
                        onClick={() => handleStatusChange(liveClass.id, 'ongoing')}
                      >
                        Start Class
                      </button>
                    )}
                    {liveClass.status === 'ongoing' && (
                      <>
                        <button 
                          className="btn btn-success"
                          onClick={() => handleJoinClass(liveClass.id, liveClass.meetingLink)}
                        >
                          🎥 Join Class
                        </button>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => handleStatusChange(liveClass.id, 'completed')}
                        >
                          End Class
                        </button>
                        <button 
                          className="btn btn-secondary"
                          onClick={() => loadAttendance(liveClass.id)}
                        >
                          View Attendance ({liveClass.joinedStudents?.length || 0})
                        </button>
                      </>
                    )}
                    {liveClass.status === 'completed' && (
                      <button 
                        className="btn btn-secondary"
                        onClick={() => loadAttendance(liveClass.id)}
                      >
                        View Attendance
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedClass && (
          <div className="dashboard-card">
            <h2>✅ Attendance Tracking</h2>
            <p>Mark attendance for students who joined the class.</p>
            
            <form onSubmit={markAttendance} className="attendance-form">
              <div className="form-group">
                <label>Student Email</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="Enter student email"
                    required
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn btn-primary">
                    Mark Present
                  </button>
                </div>
              </div>
            </form>

            <h3 style={{ marginTop: '30px' }}>Attendance List ({attendance.length})</h3>
            <div className="attendance-list">
              {attendance.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  No attendance marked yet
                </p>
              ) : (
                attendance.map(record => (
                  <div key={record.id} className="attendance-item verified">
                    <div className="attendance-info">
                      <h4>{record.studentName}</h4>
                      <p>{record.studentEmail}</p>
                      <small>Joined at: {new Date(record.joinedAt).toLocaleString()}</small>
                    </div>
                    <span className="badge local">{record.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="dashboard-card">
          <h2>👤 Profile Information</h2>
          <div className="profile-info">
            <p><strong>Faculty Name:</strong> {user?.facultyName}</p>
            <p><strong>Teacher ID:</strong> {user?.teacherId}</p>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Role:</strong> Teacher</p>
          </div>
        </div>

        <div className="dashboard-card">
          <h2>📊 Statistics</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <h3>{liveClasses.length}</h3>
              <p>Total Classes</p>
            </div>
            <div className="stat-item">
              <h3>{liveClasses.filter(c => c.status === 'completed').length}</h3>
              <p>Completed</p>
            </div>
            <div className="stat-item">
              <h3>{liveClasses.filter(c => c.status === 'scheduled').length}</h3>
              <p>Upcoming</p>
            </div>
            <div className="stat-item">
              <h3>{liveClasses.filter(c => c.status === 'ongoing').length}</h3>
              <p>Ongoing</p>
            </div>
          </div>
        </div>
      </div>

      {/* Send Message Modal */}
      {showSendMessage && (
        <div className="modal-overlay" onClick={() => setShowSendMessage(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Send Message to Students</h3>
            <form onSubmit={handleSendMessage}>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm({...messageForm, subject: e.target.value})}
                  placeholder="e.g., Class Reminder, Assignment Due"
                  required
                />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea
                  value={messageForm.message}
                  onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
                  placeholder="Type your message, reminder, or notification here..."
                  rows="6"
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowSendMessage(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Send to All Students
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
