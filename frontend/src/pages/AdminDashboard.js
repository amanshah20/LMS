import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService, liveClassService, messageService } from '../services/api';
import './Dashboard_New.css';
import './StatusMessages.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [showSendMessage, setShowSendMessage] = useState(false);
  const [messageForm, setMessageForm] = useState({
    recipientRole: 'student',
    recipientId: null,
    subject: '',
    message: ''
  });
  const [classForm, setClassForm] = useState({
    className: '',
    description: '',
    teacherId: '',
    scheduledDate: '',
    duration: 60,
    meetingLink: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [statsRes, studentsRes, teachersRes, adminsRes, classesRes] = await Promise.all([
        userService.getStats().catch(err => ({ data: { totalStudents: 0, totalTeachers: 0, totalAdmins: 0, totalClasses: 0 } })),
        userService.getStudents().catch(err => ({ data: { students: [] } })),
        userService.getTeachers().catch(err => ({ data: { teachers: [] } })),
        userService.getAdmins().catch(err => ({ data: { admins: [] } })),
        liveClassService.getAllClasses().catch(err => ({ data: { liveClasses: [] } }))
      ]);
      
      setStats(statsRes.data);
      setStudents(studentsRes.data.students || []);
      setTeachers(teachersRes.data.teachers || []);
      setAdmins(adminsRes.data.admins || []);
      setLiveClasses(classesRes.data.liveClasses || []);
      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data. Please try refreshing the page.');
      setLoading(false);
    }
  };

  const handleDeleteUser = async (type, id) => {
    if (!window.confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
      await userService.deleteUser(type, id);
      setSuccessMessage(`${type} deleted successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
      loadData();
    } catch (err) {
      setError(`Failed to delete ${type}`);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      await messageService.sendMessage(messageForm);
      setSuccessMessage('Message sent successfully!');
      setShowSendMessage(false);
      setMessageForm({
        recipientRole: 'student',
        recipientId: null,
        subject: '',
        message: ''
      });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to send message');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await liveClassService.createClass(classForm);
      setSuccessMessage('Live class created successfully');
      setShowCreateClass(false);
      setClassForm({
        className: '',
        description: '',
        teacherId: '',
        scheduledDate: '',
        duration: 60,
        meetingLink: ''
      });
      setTimeout(() => setSuccessMessage(''), 3000);
      loadData();
    } catch (err) {
      setError('Failed to create live class');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this live class?')) return;
    
    try {
      await liveClassService.deleteClass(classId);
      setSuccessMessage('Live class deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadData();
    } catch (err) {
      setError('Failed to delete live class');
      setTimeout(() => setError(''), 3000);
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
            <h1>Admin Dashboard</h1>
            <p>Welcome back, {user?.name}!</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={() => setShowSendMessage(true)} className="btn btn-primary">
              📧 Send Message
            </button>
            <button onClick={logout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            Students ({stats?.students || 0}/500)
          </button>
          <button 
            className={`tab-btn ${activeTab === 'teachers' ? 'active' : ''}`}
            onClick={() => setActiveTab('teachers')}
          >
            Teachers ({stats?.teachers || 0}/100)
          </button>
          <button 
            className={`tab-btn ${activeTab === 'admins' ? 'active' : ''}`}
            onClick={() => setActiveTab('admins')}
          >
            Admins ({stats?.admins || 0}/10)
          </button>
          <button 
            className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
            onClick={() => setActiveTab('classes')}
          >
            Live Classes
          </button>
        </div>

        {activeTab === 'overview' && (
          <>
            <div className="dashboard-card">
              <h2>📊 System Overview</h2>
              <div className="stats-grid">
                <div className="stat-item">
                  <h3>{stats?.students || 0}</h3>
                  <p>Total Students</p>
                  <small>{stats?.capacity?.students?.max - stats?.students || 500} slots remaining</small>
                </div>
                <div className="stat-item">
                  <h3>{stats?.teachers || 0}</h3>
                  <p>Total Teachers</p>
                  <small>{stats?.capacity?.teachers?.max - stats?.teachers || 100} slots remaining</small>
                </div>
                <div className="stat-item">
                  <h3>{stats?.admins || 0}</h3>
                  <p>Total Admins</p>
                  <small>{stats?.capacity?.admins?.max - stats?.admins || 10} slots remaining</small>
                </div>
                <div className="stat-item">
                  <h3>{liveClasses.length}</h3>
                  <p>Live Classes</p>
                  <small>Scheduled</small>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <h2>⚙️ Quick Actions</h2>
              <div className="button-group">
                <button className="btn btn-primary" onClick={() => setActiveTab('students')}>
                  Manage Students
                </button>
                <button className="btn btn-primary" onClick={() => setActiveTab('teachers')}>
                  Manage Teachers
                </button>
                <button className="btn btn-primary" onClick={() => setActiveTab('classes')}>
                  Manage Live Classes
                </button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'students' && (
          <div className="dashboard-card">
            <h2>👨‍🎓 Students Management</h2>
            <p>Total: {students.length} / 500 (Capacity: {500 - students.length} remaining)</p>
            <div className="users-table">
              <table>
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
                      <td><span className={`badge ${student.authMethod}`}>{student.authMethod}</span></td>
                      <td>{new Date(student.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteUser('student', student.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'teachers' && (
          <div className="dashboard-card">
            <h2>👨‍🏫 Teachers Management</h2>
            <p>Total: {teachers.length} / 100 (Capacity: {100 - teachers.length} remaining)</p>
            <div className="users-table">
              <table>
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
                      <td><span className={`badge ${teacher.authMethod}`}>{teacher.authMethod}</span></td>
                      <td>{new Date(teacher.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteUser('teacher', teacher.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'admins' && (
          <div className="dashboard-card">
            <h2>👨‍💼 Admins Management</h2>
            <p>Total: {admins.length} / 10 (Capacity: {10 - admins.length} remaining)</p>
            <div className="users-table">
              <table>
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
                            Delete
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

        {activeTab === 'classes' && (
          <div className="dashboard-card">
            <h2>📅 Live Classes Management</h2>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateClass(!showCreateClass)}
              style={{ marginBottom: '20px' }}
            >
              {showCreateClass ? 'Cancel' : '+ Create Live Class'}
            </button>

            <div className={`form-container-wrapper ${showCreateClass ? 'expanded' : ''}`}>
              {showCreateClass && (
                <form onSubmit={handleCreateClass} className="create-class-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Class Name</label>
                    <input
                      type="text"
                      required
                      value={classForm.className}
                      onChange={(e) => setClassForm({...classForm, className: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Teacher</label>
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
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Scheduled Date & Time</label>
                    <input
                      type="datetime-local"
                      required
                      value={classForm.scheduledDate}
                      onChange={(e) => setClassForm({...classForm, scheduledDate: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration (minutes)</label>
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
                <button type="submit" className="btn btn-primary">Create Class</button>
              </form>
            )}
            </div>

            <div className="classes-list">
              {liveClasses.map(liveClass => (
                <div key={liveClass.id} className="class-card">
                  <div className="class-header">
                    <h3>{liveClass.className}</h3>
                    <span className={`status-badge ${liveClass.status}`}>{liveClass.status}</span>
                  </div>
                  <p>{liveClass.description}</p>
                  <div className="class-details">
                    <p><strong>Teacher:</strong> {liveClass.Teacher?.facultyName}</p>
                    <p><strong>Date:</strong> {new Date(liveClass.scheduledDate).toLocaleString()}</p>
                    <p><strong>Duration:</strong> {liveClass.duration} minutes</p>
                    {liveClass.meetingLink && (
                      <p><strong>Link:</strong> <a href={liveClass.meetingLink} target="_blank" rel="noopener noreferrer">Join Class</a></p>
                    )}
                  </div>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDeleteClass(liveClass.id)}
                  >
                    Delete Class
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Send Message Modal */}
        {showSendMessage && (
          <div className="modal-overlay" onClick={() => setShowSendMessage(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Send Message / Notification</h3>
              <form onSubmit={handleSendMessage}>
                <div className="form-group">
                  <label>Send To</label>
                  <select
                    value={messageForm.recipientRole}
                    onChange={(e) => setMessageForm({...messageForm, recipientRole: e.target.value, recipientId: null})}
                    required
                  >
                    <option value="student">All Students</option>
                    <option value="teacher">All Teachers</option>
                    <option value="all">Everyone (Students & Teachers)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <input
                    type="text"
                    value={messageForm.subject}
                    onChange={(e) => setMessageForm({...messageForm, subject: e.target.value})}
                    placeholder="e.g., Important Announcement"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea
                    value={messageForm.message}
                    onChange={(e) => setMessageForm({...messageForm, message: e.target.value})}
                    placeholder="Type your message or notification here..."
                    rows="6"
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowSendMessage(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
