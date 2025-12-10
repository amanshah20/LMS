import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AuthCallback from './pages/AuthCallback';
import StudentDashboard from './pages/StudentDashboard_New';
import TeacherDashboard from './pages/TeacherDashboard_New';
import AdminDashboard from './pages/AdminDashboard_New';
import Unauthorized from './pages/Unauthorized';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Protected Routes */}
          <Route 
            path="/student-dashboard" 
            element={
              <PrivateRoute allowedRoles={['student']}>
                <StudentDashboard />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/teacher-dashboard" 
            element={
              <PrivateRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/admin-dashboard" 
            element={
              <PrivateRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </PrivateRoute>
            } 
          />
          
          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
