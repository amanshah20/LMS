import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './StudentProfile.css'; // Reuse student profile styles

const TeacherProfile = ({ user, onClose, onUpdate }) => {
  const [profileData, setProfileData] = useState({
    facultyName: user?.facultyName || '',
    email: user?.email || '',
    contactNumber: user?.contactNumber || '',
    subject: user?.subject || '',
    qualification: user?.qualification || '',
    experience: user?.experience || '',
    profileImage: user?.profileImage || ''
  });
  const [imagePreview, setImagePreview] = useState(user?.profileImage || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/teacher/profile/upload-image`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setImagePreview(response.data.profileImage);
      setProfileData(prev => ({
        ...prev,
        profileImage: response.data.profileImage
      }));
      setMessage('Profile picture updated successfully!');
      setLoading(false);
    } catch (err) {
      console.error('Upload error:', err);
      setMessage('Failed to upload image');
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:5000/api/teacher/profile',
        profileData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setMessage('Profile updated successfully!');
      onUpdate(response.data.teacher);
      setTimeout(() => {
        setMessage('');
        onClose();
      }, 2000);
    } catch (err) {
      console.error('Update error:', err);
      setMessage(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <h2>👨‍🏫 Teacher Profile</h2>
        
        {message && (
          <div className={`profile-message ${message.includes('success') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="profile-image-section">
            <div className="image-preview">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" />
              ) : (
                <div className="placeholder-image">
                  <span>👨‍🏫</span>
                </div>
              )}
            </div>
            <div className="image-upload">
              <label htmlFor="profileImage" className="upload-label">
                📷 Change Picture
              </label>
              <input
                type="file"
                id="profileImage"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Faculty Name *</label>
            <input
              type="text"
              name="facultyName"
              value={profileData.facultyName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={profileData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Contact Number</label>
            <input
              type="tel"
              name="contactNumber"
              value={profileData.contactNumber}
              onChange={handleInputChange}
              placeholder="Enter your contact number"
            />
          </div>

          <div className="form-group">
            <label>Subject/Department</label>
            <input
              type="text"
              name="subject"
              value={profileData.subject}
              onChange={handleInputChange}
              placeholder="e.g., Mathematics, Computer Science"
            />
          </div>

          <div className="form-group">
            <label>Qualification</label>
            <input
              type="text"
              name="qualification"
              value={profileData.qualification}
              onChange={handleInputChange}
              placeholder="e.g., M.Sc, Ph.D"
            />
          </div>

          <div className="form-group">
            <label>Years of Experience</label>
            <input
              type="number"
              name="experience"
              value={profileData.experience}
              onChange={handleInputChange}
              placeholder="Years of teaching experience"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-save">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherProfile;
