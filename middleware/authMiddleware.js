// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path as needed
const asyncHandler = require('./asyncHandler'); // We'll create this utility next

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // 1) Getting token and check if it's there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // else if (req.cookies.jwt) { // Optional: Check for token in cookies
  //   token = req.cookies.jwt;
  // }

  if (!token) {
    res.status(401); // Unauthorized
    throw new Error('Not authorized, no token');
  }

  try {
    // 2) Verification token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    // Find user by ID from token payload, exclude password
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      res.status(401);
      throw new Error('User belonging to this token does no longer exist.');
    }

    // 4) Optional: Check if user changed password after the token was issued
    if (req.user.changedPasswordAfter(decoded.iat)) {
         res.status(401);
         throw new Error('User recently changed password! Please log in again.');
    }


    // GRANT ACCESS TO PROTECTED ROUTE
    next();
  } catch (error) {
    console.error('Authentication Error:', error);
     // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
        res.status(401);
        throw new Error('Not authorized, invalid token');
    }
    if (error.name === 'TokenExpiredError') {
        res.status(401);
        throw new Error('Not authorized, token expired');
    }
    // Rethrow other errors or the specific ones above
    res.status(401); // Ensure status is set before throwing
    throw new Error(error.message || 'Not authorized, token failed');
  }
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, no user found for role check');
    }
    if (!roles.includes(req.user.role)) {
      res.status(403); // Forbidden
      throw new Error(`User role ${req.user.role} is not authorized to access this route`);
    }
    next();
  };
};

const admin = authorize('admin', 'superadmin');
const mentor = authorize('mentor', 'admin', 'superadmin');
const recruiter = authorize('recruiter', 'admin', 'superadmin');


module.exports = { protect, authorize, admin, mentor, recruiter };