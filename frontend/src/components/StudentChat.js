import React, { useState, useEffect, useRef } from 'react';
import { studentChatService } from '../services/api';
import './StudentChat.css';

const StudentChat = ({ user }) => {
  const [chats, setChats] = useState([]);
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [noteMessage, setNoteMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadChats();
    const interval = setInterval(loadChats, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    try {
      const res = await studentChatService.getAllChats();
      setChats(res.data.chats);
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Message cannot be empty');
      setTimeout(() => setError(''), 2000);
      return;
    }
    
    try {
      setLoading(true);
      await studentChatService.sendMessage({ message: message.trim() });
      setMessage('');
      await loadChats();
      setLoading(false);
    } catch (err) {
      console.error('Send message error:', err);
      setError(err.response?.data?.message || 'Failed to send message');
      setTimeout(() => setError(''), 3000);
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  const handleUploadNote = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Please select a file');
      setTimeout(() => setError(''), 2000);
      return;
    }
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('message', noteMessage || 'Shared a note');
    
    try {
      setLoading(true);
      await studentChatService.uploadNote(formData);
      setSelectedFile(null);
      setFilePreview(null);
      setNoteMessage('');
      document.getElementById('fileInput').value = '';
      await loadChats();
      setLoading(false);
    } catch (err) {
      console.error('Upload note error:', err);
      setError(err.response?.data?.message || 'Failed to upload note');
      setTimeout(() => setError(''), 3000);
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (chatId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await studentChatService.deleteMessage(chatId);
      loadChats();
    } catch (err) {
      setError('Failed to delete message');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      default:
        return '📎';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="student-chat-container">
      <div className="chat-header">
        <h2>💬 Student Discussion & Notes</h2>
        <p>Share notes and chat with your classmates</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="chat-controls">
        <div className="control-tabs">
          <div className="control-tab">
            <h3>💬 Send Message</h3>
            <form onSubmit={handleSendMessage} className="message-form">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
              />
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>

          <div className="control-tab">
            <h3>📎 Upload Note</h3>
            <form onSubmit={handleUploadNote} className="upload-form">
              <input
                type="file"
                id="fileInput"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <label htmlFor="fileInput" className="btn btn-secondary">
                {selectedFile ? selectedFile.name : 'Choose File'}
              </label>
              {selectedFile && (
                <>
                  <input
                    type="text"
                    value={noteMessage}
                    onChange={(e) => setNoteMessage(e.target.value)}
                    placeholder="Add a description (optional)"
                    className="note-description"
                  />
                  <button type="submit" disabled={loading} className="btn btn-success">
                    {loading ? 'Uploading...' : 'Upload'}
                  </button>
                </>
              )}
            </form>
            {filePreview && (
              <div className="file-preview-small">
                <img src={filePreview} alt="Preview" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {chats.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          chats.map((chat) => (
            <div 
              key={chat.id} 
              className={`chat-message ${chat.studentId === user.id ? 'own-message' : ''}`}
            >
              <div className="message-header">
                <span className="sender-name">{chat.studentName}</span>
                <span className="message-time">{formatTime(chat.createdAt)}</span>
              </div>
              
              {chat.messageType === 'text' ? (
                <div className="message-content">
                  <p>{chat.message}</p>
                </div>
              ) : (
                <div className="note-content">
                  <div className="note-info">
                    <span className="file-icon">{getFileIcon(chat.fileType)}</span>
                    <div>
                      <p className="note-message">{chat.message}</p>
                      <p className="file-name">{chat.fileName}</p>
                    </div>
                  </div>
                  
                  {chat.fileType === 'jpg' || chat.fileType === 'jpeg' || chat.fileType === 'png' || chat.fileType === 'gif' ? (
                    <div className="note-image">
                      <img 
                        src={`http://localhost:5000${chat.fileUrl}`} 
                        alt={chat.fileName}
                        onClick={() => window.open(`http://localhost:5000${chat.fileUrl}`, '_blank')}
                      />
                    </div>
                  ) : (
                    <a 
                      href={`http://localhost:5000${chat.fileUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="download-link"
                    >
                      📥 Download {chat.fileType.toUpperCase()}
                    </a>
                  )}
                </div>
              )}
              
              {chat.studentId === user.id && (
                <button 
                  className="delete-message-btn"
                  onClick={() => handleDeleteMessage(chat.id)}
                  title="Delete message"
                >
                  🗑️
                </button>
              )}
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>
    </div>
  );
};

export default StudentChat;
