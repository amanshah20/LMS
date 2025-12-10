import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import './IDCardGenerator.css';

const IDCardGenerator = ({ user, onClose }) => {
  const [mode, setMode] = useState(null); // null | 'auto' | 'manual'
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    address: '',
    parentContact: ''
  });

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    if (selectedMode === 'auto') {
      // Auto-fill from user profile
      setFormData({
        fullName: user?.fullName || '',
        address: user?.address || 'Not Provided',
        parentContact: user?.parentPhoneNumber || 'Not Provided'
      });
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'manual' && (!formData.fullName || !formData.address || !formData.parentContact)) {
      alert('Please fill all required fields');
      return;
    }
    // Both modes show the ID card
    setMode('preview');
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      const idCardElement = document.getElementById('id-card-preview');
      const canvas = await html2canvas(idCardElement, {
        backgroundColor: '#ffffff',
        scale: 2
      });
      
      const link = document.createElement('a');
      link.download = `student-id-card-${user?.studentId || 'student'}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      setLoading(false);
      alert('✅ ID Card downloaded successfully!');
    } catch (error) {
      console.error('Error generating ID card:', error);
      alert('Failed to download ID card. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="id-card-modal-overlay" onClick={onClose}>
      <div className="id-card-modal" onClick={(e) => e.stopPropagation()}>
        <div className="id-card-header">
          <h2>🎓 Student ID Card Generator</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Mode Selection */}
        {!mode && (
          <div className="mode-selection">
            <p className="mode-description">Choose how you want to generate your ID card:</p>
            <div className="mode-buttons">
              <button 
                className="mode-btn auto-mode"
                onClick={() => handleModeSelect('auto')}
              >
                <div className="mode-icon">⚡</div>
                <h3>Auto Generate</h3>
                <p>Generate instantly using your profile information</p>
              </button>
              <button 
                className="mode-btn manual-mode"
                onClick={() => handleModeSelect('manual')}
              >
                <div className="mode-icon">✏️</div>
                <h3>Detailed ID</h3>
                <p>Fill in additional details for a comprehensive ID card</p>
              </button>
            </div>
          </div>
        )}

        {/* Manual Form */}
        {mode === 'manual' && (
          <div className="id-form">
            <button 
              className="btn-back"
              onClick={() => setMode(null)}
            >
              ← Back to Options
            </button>
            <h3>Enter Student Details</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-group">
                <label>Full Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your complete address"
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Parent's Contact Number *</label>
                <input
                  type="tel"
                  name="parentContact"
                  value={formData.parentContact}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter parent's phone number"
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Generate ID Card
              </button>
            </form>
          </div>
        )}

        {/* Auto Generation or Preview */}
        {(mode === 'auto' || mode === 'preview') && (
          <div className="id-card-preview-section">
            {mode === 'auto' && (
              <button 
                className="btn-back"
                onClick={() => setMode(null)}
              >
                ← Back to Options
              </button>
            )}
            {mode === 'preview' && (
              <button 
                className="btn-back"
                onClick={() => setMode('manual')}
              >
                ← Edit Details
              </button>
            )}
            
            <div id="id-card-preview" className="id-card">
              <div className="id-card-header-section">
                <div className="school-logo">🎓</div>
                <div className="school-info">
                  <h2>LEARNING MANAGEMENT SYSTEM</h2>
                  <p>Student Identification Card</p>
                </div>
              </div>

              <div className="id-card-body">
                <div className="student-photo">
                  {user?.profileImage ? (
                    <img 
                      src={`http://localhost:5000${user.profileImage}`} 
                      alt="Student" 
                    />
                  ) : (
                    <div className="photo-placeholder">
                      {formData.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="student-details">
                  <div className="detail-row">
                    <span className="label">Name:</span>
                    <span className="value">{formData.fullName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Student ID:</span>
                    <span className="value">{user?.studentId || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Email:</span>
                    <span className="value">{user?.email || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Address:</span>
                    <span className="value">{formData.address}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Parent's Contact:</span>
                    <span className="value">{formData.parentContact}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Issue Date:</span>
                    <span className="value">{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="id-card-footer">
                <p className="validity">Valid for Academic Year 2025-2026</p>
              </div>
            </div>

            <div className="action-buttons">
              <button 
                className="btn btn-primary"
                onClick={handleDownload}
                disabled={loading}
              >
                {loading ? '⏳ Generating...' : '📥 Download ID Card'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IDCardGenerator;
