import React, { useState, useEffect } from 'react';
import { studentProfileService } from '../services/api';
import './StudentProfile.css';

const StudentProfile = ({ user, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('info');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    contactNumber: '',
    parentPhoneNumber: '',
    address: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      console.log('📋 Loading student profile...');
      const res = await studentProfileService.getProfile();
      console.log('✅ Profile loaded:', res.data.student);
      setProfile(res.data.student);
      setProfileForm({
        fullName: res.data.student.fullName || '',
        contactNumber: res.data.student.contactNumber || '',
        parentPhoneNumber: res.data.student.parentPhoneNumber || '',
        address: res.data.student.address || ''
      });
      setLoading(false);
    } catch (err) {
      console.error('❌ Failed to load profile:', err);
      console.error('❌ Error details:', err.response?.data);
      setError(err.response?.data?.message || 'Failed to load profile. Please try again.');
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await studentProfileService.updateProfile(profileForm);
      setMessage('Profile updated successfully!');
      setProfile(res.data.student);
      onUpdate(res.data.student);
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Update profile error:', err);
      setError(err.response?.data?.message || 'Failed to update profile');
      setLoading(false);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    try {
      await studentProfileService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setMessage('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadImage = async () => {
    if (!selectedImage) {
      setError('Please select an image');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    const formData = new FormData();
    formData.append('profileImage', selectedImage);
    
    try {
      setLoading(true);
      const res = await studentProfileService.uploadProfileImage(formData);
      setMessage('Profile image uploaded successfully!');
      const updatedProfile = { ...profile, profileImage: res.data.profileImage };
      setProfile(updatedProfile);
      onUpdate(updatedProfile);
      setSelectedImage(null);
      setImagePreview(null);
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Upload image error:', err);
      setError(err.response?.data?.message || 'Failed to upload image');
      setLoading(false);
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="profile-modal-overlay" onClick={onClose}>
        <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>My Profile</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}

        <div className="profile-tabs">
          <button 
            className={`profile-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Profile Info
          </button>
          <button 
            className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Change Password
          </button>
          <button 
            className={`profile-tab ${activeTab === 'image' ? 'active' : ''}`}
            onClick={() => setActiveTab('image')}
          >
            Profile Image
          </button>
        </div>

        <div className="profile-content">
          {activeTab === 'info' && (
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({...profileForm, fullName: e.target.value})}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Email (Cannot be changed)</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  style={{ background: '#f0f0f0' }}
                />
              </div>
              
              <div className="form-group">
                <label>Contact Number</label>
                <input
                  type="tel"
                  value={profileForm.contactNumber}
                  onChange={(e) => setProfileForm({...profileForm, contactNumber: e.target.value})}
                  placeholder="Your phone number"
                />
              </div>
              
              <div className="form-group">
                <label>Parent's Phone Number</label>
                <input
                  type="tel"
                  value={profileForm.parentPhoneNumber}
                  onChange={(e) => setProfileForm({...profileForm, parentPhoneNumber: e.target.value})}
                  placeholder="Parent's contact number"
                />
              </div>
              
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({...profileForm, address: e.target.value})}
                  placeholder="Your full address"
                  rows="3"
                />
              </div>
              
              <button type="submit" className="btn btn-primary">Update Profile</button>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleChangePassword}>
              {profile?.authMethod === 'google' ? (
                <div className="info-box">
                  <p>⚠️ You are logged in with Google. Password change is not available for Google accounts.</p>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      required
                      minLength="6"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      required
                      minLength="6"
                    />
                  </div>
                  
                  <button type="submit" className="btn btn-primary">Change Password</button>
                </>
              )}
            </form>
          )}

          {activeTab === 'image' && (
            <div className="profile-image-section">
              <div className="current-image">
                <h3>Current Profile Image</h3>
                {profile?.profileImage ? (
                  <img 
                    src={`http://localhost:5000${profile.profileImage}`} 
                    alt="Profile" 
                    className="profile-img-large"
                  />
                ) : (
                  <div className="no-image">No profile image</div>
                )}
              </div>
              
              <div className="upload-section">
                <h3>Upload New Image</h3>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  id="imageUpload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="imageUpload" className="btn btn-secondary">
                  Choose Image
                </label>
                
                {imagePreview && (
                  <div className="image-preview">
                    <img src={imagePreview} alt="Preview" />
                    <button onClick={handleUploadImage} className="btn btn-primary">
                      Upload Image
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
