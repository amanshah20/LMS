import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [userType, setUserType] = useState('student');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    accessKey: '',
    teacherId: '',
    adminCode: '',
    name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let response;
      
      if (userType === 'student') {
        response = await authService.studentLogin({
          fullName: formData.fullName,
          email: formData.email,
          accessKey: formData.accessKey
        });
      } else if (userType === 'teacher') {
        response = await authService.teacherLogin({
          teacherId: formData.teacherId,
          password: formData.password
        });
      } else if (userType === 'admin') {
        response = await authService.adminLogin({
          adminCode: formData.adminCode,
          name: formData.name
        });
      }

      login(response.data.user, response.data.token);
      navigate(`/${userType}-dashboard`);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (userType === 'admin') {
      setError('Admin cannot login with Google');
      return;
    }
    authService.googleAuth(userType);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Login</h1>
        <p className="auth-subtitle">Welcome back to LMS</p>

        <div className="user-type-selector">
          <button
            className={`type-btn ${userType === 'student' ? 'active' : ''}`}
            onClick={() => setUserType('student')}
          >
            Student
          </button>
          <button
            className={`type-btn ${userType === 'teacher' ? 'active' : ''}`}
            onClick={() => setUserType('teacher')}
          >
            Teacher
          </button>
          <button
            className={`type-btn ${userType === 'admin' ? 'active' : ''}`}
            onClick={() => setUserType('admin')}
          >
            Admin
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {userType === 'student' && (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                />
              </div>
              <div className="form-group">
                <label>Access Key</label>
                <input
                  type="text"
                  name="accessKey"
                  value={formData.accessKey}
                  onChange={handleChange}
                  required
                  placeholder="Enter 7-digit access key from admin"
                  maxLength="7"
                />
              </div>
            </>
          )}

          {userType === 'teacher' && (
            <>
              <div className="form-group">
                <label>Teacher ID (5 digits)</label>
                <input
                  type="text"
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={handleChange}
                  required
                  placeholder="Enter your 5-digit teacher ID"
                  maxLength="5"
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                />
              </div>
            </>
          )}

          {userType === 'admin' && (
            <>
              <div className="form-group">
                <label>Admin Code (5 digits)</label>
                <input
                  type="text"
                  name="adminCode"
                  value={formData.adminCode}
                  onChange={handleChange}
                  required
                  placeholder="Enter 5-digit admin code"
                  maxLength="5"
                />
              </div>
              <div className="form-group">
                <label>Admin Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter admin name"
                />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {userType !== 'admin' && (
          <>
            <div className="divider">
              <span>OR</span>
            </div>

            <button onClick={handleGoogleLogin} className="btn btn-google btn-block">
              <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Continue with Google
            </button>
          </>
        )}

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
