import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication Services
export const authService = {
  // Student
  studentSignup: (data) => api.post('/auth/student/signup', data),
  studentLogin: (data) => api.post('/auth/student/login', data),
  
  // Teacher
  teacherSignup: (data) => api.post('/auth/teacher/signup', data),
  teacherLogin: (data) => api.post('/auth/teacher/login', data),
  
  // Admin
  adminSignup: (data) => api.post('/auth/admin/signup', data),
  adminLogin: (data) => api.post('/auth/admin/login', data),
  
  // Google OAuth
  googleAuth: (userType) => {
    window.location.href = `${API_URL}/auth/google/${userType}`;
  },
};

// User Management Services
export const userService = {
  getStudents: () => api.get('/users/students'),
  getTeachers: () => api.get('/users/teachers'),
  getAdmins: () => api.get('/users/admins'),
  getStats: () => api.get('/users/stats'),
  deleteUser: (type, id) => api.delete(`/users/user/${type}/${id}`),
  generateAccessKey: (studentId) => api.post(`/users/student/${studentId}/generate-key`),
  createStudentWithKey: (data) => api.post('/users/student/create-with-key', data)
};

// Live Class Services
export const liveClassService = {
  createClass: (classData) => api.post('/live-classes/create', classData),
  getAllClasses: () => api.get('/live-classes/all'),
  getTeacherClasses: (teacherId) => api.get(`/live-classes/teacher/${teacherId}`),
  updateStatus: (classId, status) => api.put(`/live-classes/${classId}/status`, { status }),
  joinClass: (classId) => api.post(`/live-classes/${classId}/join`),
  markAttendance: (classId, data) => api.post(`/live-classes/${classId}/attendance`, data),
  getAttendance: (classId) => api.get(`/live-classes/${classId}/attendance`),
  deleteClass: (classId) => api.delete(`/live-classes/${classId}`),
  getMyAttendance: () => api.get('/live-classes/student/my-attendance')
};

export const messageService = {
  sendMessage: (messageData) => api.post('/messages/send', messageData),
  getMyMessages: () => api.get('/messages/my-messages'),
  markAsRead: (messageId) => api.put(`/messages/${messageId}/read`),
  getSentMessages: () => api.get('/messages/sent'),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`)
};

// Student Profile Services
export const studentProfileService = {
  getProfile: () => api.get('/student/profile/profile'),
  updateProfile: (data) => api.put('/student/profile/profile', data),
  changePassword: (data) => api.put('/student/profile/change-password', data),
  uploadProfileImage: (formData) => {
    return api.post('/student/profile/upload-profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
};

// Student Chat Services
export const studentChatService = {
  getAllChats: () => api.get('/student/chat/all'),
  sendMessage: (data) => api.post('/student/chat/send-message', data),
  uploadNote: (formData) => {
    return api.post('/student/chat/upload-note', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteMessage: (id) => api.delete(`/student/chat/${id}`)
};

// Assignment Services
export const assignmentService = {
  getAllAssignments: () => api.get('/assignments/all'),
  getAssignmentById: (id) => api.get(`/assignments/${id}`),
  createAssignment: (formData) => {
    return api.post('/assignments/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  updateAssignment: (id, data) => api.put(`/assignments/${id}`, data),
  deleteAssignment: (id) => api.delete(`/assignments/${id}`),
  getTeacherAssignments: () => api.get('/assignments/teacher/my-assignments')
};

// Course Services
export const courseService = {
  getAllCourses: () => api.get('/courses/all'),
  getCourseById: (id) => api.get(`/courses/${id}`),
  createCourse: (data) => api.post('/courses/create', data),
  updateCourse: (id, data) => api.put(`/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  addVideo: (courseId, data) => api.post(`/courses/${courseId}/videos`, data),
  deleteVideo: (courseId, videoId) => api.delete(`/courses/${courseId}/videos/${videoId}`)
};

// Notification Services
export const notificationService = {
  getMyNotifications: () => api.get('/notifications/my-notifications'),
  createNotification: (data) => api.post('/notifications/create', data),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`)
};

// Teacher Access Key Services
export const teacherAccessKeyService = {
  createAccessKey: (data) => api.post('/teacher-access-keys/create', data),
  getAllAccessKeys: () => api.get('/teacher-access-keys/all'),
  verifyAccessKey: (data) => api.post('/teacher-access-keys/verify', data),
  deleteAccessKey: (id) => api.delete(`/teacher-access-keys/${id}`),
  regenerateAccessId: (id) => api.put(`/teacher-access-keys/${id}/regenerate`)
};

// Online Exam Services
export const onlineExamService = {
  createExam: (data) => api.post('/online-exams/create', data),
  getAllExams: () => api.get('/online-exams/all'),
  getAvailableExams: () => api.get('/online-exams/student/available'),
  joinExam: (examId) => api.post(`/online-exams/${examId}/join`),
  lockExam: (examId) => api.put(`/online-exams/${examId}/lock`),
  unlockExam: (examId) => api.put(`/online-exams/${examId}/unlock`),
  deleteExam: (examId) => api.delete(`/online-exams/${examId}`),
  getParticipants: (examId) => api.get(`/online-exams/${examId}/participants`),
  getExamQuestions: (examId) => api.get(`/online-exams/${examId}/take-exam`),
  submitExam: (examId, answers) => api.post(`/online-exams/${examId}/submit`, { answers }),
  publishResults: (examId) => api.post(`/online-exams/${examId}/publish-results`),
  getMyResults: () => api.get('/online-exams/my-results')
};

// Fee Management Services
export const feeService = {
  getAllFees: () => api.get('/fees/all'),
  getMyFees: () => api.get('/fees/my-fees'),
  createFee: (data) => api.post('/fees/create', data),
  updateFee: (id, data) => api.put(`/fees/${id}`, data),
  deleteFee: (id) => api.delete(`/fees/${id}`),
  payFee: (data) => api.post('/fees/pay', data),
  submitQuery: (data) => api.post('/fees/query', data),
  getAllQueries: () => api.get('/fees/queries'),
  getMyQueries: () => api.get('/fees/my-queries'),
  respondToQuery: (id, response) => api.put(`/fees/query/${id}/respond`, { response })
};

// User Storage Management
export const getUserFromStorage = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// Student Tools Services
export const studentToolsService = {
  // Notes
  getNotes: () => api.get('/student/tools/notes'),
  createNote: (data) => api.post('/student/tools/notes', data),
  updateNote: (id, data) => api.put(`/student/tools/notes/${id}`, data),
  deleteNote: (id) => api.delete(`/student/tools/notes/${id}`),
  
  // Todos
  getTodos: () => api.get('/student/tools/todos'),
  createTodo: (data) => api.post('/student/tools/todos', data),
  updateTodo: (id, data) => api.put(`/student/tools/todos/${id}`, data),
  deleteTodo: (id) => api.delete(`/student/tools/todos/${id}`),
  
  // AI Chat
  getAIChats: () => api.get('/student/tools/ai-chat'),
  sendAIMessage: (data) => api.post('/student/tools/ai-chat', data),
  clearAIChat: () => api.delete('/student/tools/ai-chat'),
  
  // Classmate Chat
  getClassmateMessages: () => api.get('/student/tools/classmate-chat'),
  sendTextMessage: (data) => api.post('/student/tools/classmate-chat/text', data),
  sendVoiceMessage: (formData) => {
    return api.post('/student/tools/classmate-chat/voice', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteClassmateMessage: (id) => api.delete(`/student/tools/classmate-chat/${id}`)
};

export const setUserInStorage = (user, token) => {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('token', token);
};

export const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  window.location.href = '/login';
};

export default api;
