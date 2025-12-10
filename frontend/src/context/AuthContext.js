import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUserFromStorage, setUserInStorage, logout } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = getUserFromStorage();
    if (userData) {
      setUser(userData);
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setUser(userData);
    setUserInStorage(userData, token);
  };

  const logoutUser = () => {
    setUser(null);
    logout();
  };

  const updateUser = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    const token = localStorage.getItem('token');
    if (token) {
      setUserInStorage(updatedUser, token);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout: logoutUser, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
