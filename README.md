# LMS - Learning Management System

A comprehensive Learning Management System for universities and high schools with separate dashboards for Students, Teachers, and Admins.

## 🚀 Features

### For Students
- ✅ Sign up with email or Google OAuth
- ✅ Login with credentials
- ✅ Personal dashboard with course overview
- ✅ View assignments and progress
- ✅ Track learning statistics

### For Teachers
- ✅ Sign up with Teacher ID (8 digits) or Google OAuth
- ✅ Login with Teacher ID and password
- ✅ Dedicated teacher dashboard
- ✅ Manage courses and students
- ✅ Create and grade assignments
- ✅ Post announcements

### For Admins
- ✅ Secure signup with 5-digit admin code
- ✅ Login with admin code and name
- ✅ Complete system management dashboard
- ✅ Manage all users (students, teachers)
- ✅ Course management
- ✅ System analytics and settings

## 📁 Project Structure

```
Capstone_Project/
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── passport.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Admin.js
│   │   ├── Student.js
│   │   └── Teacher.js
│   ├── routes/
│   │   └── auth.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── PrivateRoute.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── AdminDashboard.js
    │   │   ├── Auth.css
    │   │   ├── AuthCallback.js
    │   │   ├── Dashboard.css
    │   │   ├── Home.js
    │   │   ├── Home.css
    │   │   ├── Login.js
    │   │   ├── Signup.js
    │   │   ├── StudentDashboard.js
    │   │   ├── TeacherDashboard.js
    │   │   └── Unauthorized.js
    │   ├── services/
    │   │   └── api.js
    │   ├── App.js
    │   ├── index.css
    │   └── index.js
    ├── .env
    └── package.json
```

## 🛠️ Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Passport.js (Google OAuth)
- bcryptjs (Password hashing)
- express-validator

### Frontend
- React.js
- React Router DOM
- Axios
- CSS3

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Google Cloud Console account (for OAuth)

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
cd G:\Semester-7\Capstone_Project
```

### 2. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file
copy .env.example .env
```

### 3. Configure Backend Environment Variables

Edit the `.env` file in the backend folder:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/lms_database
JWT_SECRET=your_secure_jwt_secret_key_change_this
GOOGLE_CLIENT_ID=your_google_client_id_from_console
GOOGLE_CLIENT_SECRET=your_google_client_secret_from_console
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
SESSION_SECRET=your_secure_session_secret_key
FRONTEND_URL=http://localhost:3000
```

### 4. Set Up Google OAuth (Optional but Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### 5. Start MongoDB

```bash
# If using local MongoDB
mongod
```

Or use MongoDB Atlas (cloud database):
- Update `MONGODB_URI` in `.env` with your Atlas connection string

### 6. Start Backend Server

```bash
# In backend folder
npm start

# Or for development with auto-reload
npm run dev
```

Backend should be running on `http://localhost:5000`

### 7. Frontend Setup

```bash
# Open new terminal and navigate to frontend folder
cd frontend

# Install dependencies
npm install
```

### 8. Start Frontend

```bash
# In frontend folder
npm start
```

Frontend should open automatically at `http://localhost:3000`

## 🎯 Usage Guide

### Student Registration & Login

**Sign Up:**
1. Go to Signup page
2. Select "Student" role
3. Enter:
   - Full Name
   - Email
   - Contact Number
   - Password
4. Or click "Continue with Google"

**Login:**
1. Go to Login page
2. Select "Student"
3. Enter email and password
4. Or use Google sign-in

### Teacher Registration & Login

**Sign Up:**
1. Go to Signup page
2. Select "Teacher" role
3. Enter:
   - Teacher ID (8 digits) - provided by institution
   - Faculty Name
   - Email
   - Password
4. Or click "Continue with Google"

**Login:**
1. Go to Login page
2. Select "Teacher"
3. Enter Teacher ID and password
4. Or use Google sign-in

### Admin Registration & Login

**First Time Setup (Sign Up):**
1. Go to Signup page
2. Select "Admin" role
3. Enter:
   - Admin Code (5 digits) - create your own
   - Admin Name
   - Password
4. These credentials will be saved

**Subsequent Logins:**
1. Go to Login page
2. Select "Admin"
3. Enter the same Admin Code and Name used during signup

⚠️ **Important:** Admin cannot use Google OAuth for security reasons.

## 🔐 API Endpoints

### Authentication Routes

#### Student
- `POST /api/auth/student/signup` - Student registration
- `POST /api/auth/student/login` - Student login

#### Teacher
- `POST /api/auth/teacher/signup` - Teacher registration
- `POST /api/auth/teacher/login` - Teacher login

#### Admin
- `POST /api/auth/admin/signup` - Admin registration (first time)
- `POST /api/auth/admin/login` - Admin login

#### Google OAuth
- `GET /api/auth/google/:userType` - Initiate Google OAuth (student/teacher)
- `GET /api/auth/google/callback` - Google OAuth callback

#### Health Check
- `GET /api/health` - Server health status

## 🧪 Testing

### Test Student Account
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "contactNumber": "1234567890"
}
```

### Test Teacher Account
```json
{
  "teacherId": "12345678",
  "facultyName": "Dr. Jane Smith",
  "email": "jane@example.com",
  "password": "password123"
}
```

### Test Admin Account
```json
{
  "adminCode": "12345",
  "name": "Admin User",
  "password": "password123"
}
```

## 🚧 Future Enhancements

This is the base structure. You can add:
- [ ] Course creation and management
- [ ] Assignment submission system
- [ ] File upload functionality
- [ ] Real-time notifications
- [ ] Video conferencing integration
- [ ] Gradebook system
- [ ] Calendar and scheduling
- [ ] Discussion forums
- [ ] Quiz and assessment tools
- [ ] Progress tracking and analytics
- [ ] Email notifications
- [ ] Mobile responsive design improvements

## 🔒 Security Features

- ✅ Password hashing with bcryptjs
- ✅ JWT token authentication
- ✅ Protected routes
- ✅ Role-based access control
- ✅ Secure session management
- ✅ Input validation
- ✅ CORS configuration

## 📝 Environment Variables Reference

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/lms_database |
| JWT_SECRET | Secret for JWT tokens | your_secret_key |
| GOOGLE_CLIENT_ID | Google OAuth Client ID | your_client_id |
| GOOGLE_CLIENT_SECRET | Google OAuth Client Secret | your_client_secret |
| GOOGLE_CALLBACK_URL | OAuth callback URL | http://localhost:5000/api/auth/google/callback |
| SESSION_SECRET | Express session secret | your_session_secret |
| FRONTEND_URL | Frontend application URL | http://localhost:3000 |

### Frontend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| REACT_APP_API_URL | Backend API URL | http://localhost:5000/api |

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- Verify MongoDB service is active

### Google OAuth Not Working
- Verify Google credentials in .env
- Check authorized redirect URIs in Google Console
- Ensure FRONTEND_URL and GOOGLE_CALLBACK_URL are correct

### CORS Error
- Check FRONTEND_URL in backend .env
- Verify frontend is running on port 3000

### Port Already in Use
- Change PORT in backend .env
- Update REACT_APP_API_URL in frontend .env

## 📞 Support

For issues or questions, please refer to the documentation or create an issue in the repository.

## 📄 License

This project is for educational purposes.

---

**Note:** Remember to keep your `.env` files secure and never commit them to version control!
