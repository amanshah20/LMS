const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

module.exports = function(passport) {
  // Only configure Google OAuth if credentials are provided
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id') {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
          passReqToCallback: true
        },
        async (req, accessToken, refreshToken, profile, done) => {
          try {
            const userType = req.session.userType; // student or teacher
            const email = profile.emails[0].value;
            
            if (userType === 'student') {
              let student = await Student.findOne({ where: { email } });
              
              if (!student) {
                student = await Student.create({
                  googleId: profile.id,
                  email: email,
                  fullName: profile.displayName,
                  authMethod: 'google'
                });
              }
              
              return done(null, { user: student.toJSON(), userType: 'student' });
            } else if (userType === 'teacher') {
              let teacher = await Teacher.findOne({ where: { email } });
              
              if (!teacher) {
                teacher = await Teacher.create({
                  googleId: profile.id,
                  email: email,
                  facultyName: profile.displayName,
                  authMethod: 'google'
                });
              }
              
              return done(null, { user: teacher.toJSON(), userType: 'teacher' });
            }
          } catch (error) {
            return done(error, null);
          }
        }
      )
    );
  }

  passport.serializeUser((data, done) => {
    done(null, data);
  });

  passport.deserializeUser((data, done) => {
    done(null, data);
  });
};
