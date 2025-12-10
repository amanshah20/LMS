import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const role = searchParams.get('role');

    if (token && role) {
      // Decode token to get user info (in production, verify token on backend)
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      const user = {
        id: payload.id,
        email: payload.email,
        role: payload.role
      };

      login(user, token);
      navigate(`/${role}-dashboard`);
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, login]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div className="spinner"></div>
    </div>
  );
};

export default AuthCallback;
