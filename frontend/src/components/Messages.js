import React, { useState, useEffect } from 'react';
import { messageService } from '../services/api';
import '../pages/Dashboard.css';
import '../pages/StatusMessages.css';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const res = await messageService.getMyMessages();
      setMessages(res.data.messages || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to load messages');
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await messageService.markAsRead(messageId);
      loadMessages();
    } catch (err) {
      setError('Failed to mark message as read');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-card">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <h2>📬 Messages & Notifications</h2>
      {error && <div className="error-message">{error}</div>}
      
      {messages.length === 0 ? (
        <div className="placeholder-content">
          <p>No messages yet.</p>
        </div>
      ) : (
        <div className="messages-list">
          {messages.map(message => (
            <div 
              key={message.id} 
              className={`message-item ${message.isRead ? 'read' : 'unread'}`}
              onClick={() => !message.isRead && handleMarkAsRead(message.id)}
            >
              <div className="message-header">
                <div>
                  <strong>{message.subject}</strong>
                  {!message.isRead && <span className="new-badge">NEW</span>}
                </div>
                <span className="message-date">
                  {new Date(message.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="message-sender">From: {message.senderName}</p>
              <p className="message-body">{message.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages;
