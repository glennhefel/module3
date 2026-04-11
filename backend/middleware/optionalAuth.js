import jwt from 'jsonwebtoken';

export function optionalAuthenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    // No token provided, continue without user
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // Invalid token, continue without user
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
}
