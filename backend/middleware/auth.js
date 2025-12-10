const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Token decoded:', { id: decoded.id, role: decoded.role, email: decoded.email });
    req.user = decoded;
    next();
  } catch (error) {
    console.log('❌ Token verification failed:', error.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    console.log('🔐 Role check - User role:', req.user?.role, '| Required roles:', roles);
    if (!req.user || !roles.includes(req.user.role)) {
      console.log('❌ Access denied - User role:', req.user?.role, 'not in', roles);
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    console.log('✅ Access granted for role:', req.user.role);
    next();
  };
};

module.exports = { authMiddleware, roleMiddleware };
