import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-content">
        <div className="home-card">
          <h1 className="home-title">Welcome to LMS</h1>
          <p className="home-subtitle">
            Learning Management System for Universities and High Schools
          </p>
          <p className="home-description">
            Access your courses, assignments, and connect with your learning community
          </p>
          <div className="home-buttons">
            <Link to="/login" className="btn btn-primary">
              Login
            </Link>
            <Link to="/signup" className="btn btn-secondary">
              Sign Up
            </Link>
          </div>
        </div>
        <div className="home-features">
          <div className="feature-item">
            <div className="feature-icon">👨‍🎓</div>
            <h3>For Students</h3>
            <p>Access courses, submit assignments, and track your progress</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">👨‍🏫</div>
            <h3>For Teachers</h3>
            <p>Create courses, manage students, and grade assignments</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon">👨‍💼</div>
            <h3>For Admins</h3>
            <p>Manage the entire system, users, and courses</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
