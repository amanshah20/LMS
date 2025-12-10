import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      textAlign: 'center'
    }}>
      <div className="card" style={{ maxWidth: '500px' }}>
        <h1 style={{ fontSize: '72px', margin: '0' }}>403</h1>
        <h2>Access Denied</h2>
        <p style={{ color: '#666', marginBottom: '30px' }}>
          You don't have permission to access this page.
        </p>
        <Link to="/login" className="btn btn-primary">
          Go to Login
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
