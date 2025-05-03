// routes/authRoutes.js
const express = require('express');
const {
    registerUser,
    verifyOTP, // Import new controller
    loginUser,
    getMe,
    logoutUser,
    verifyResetToken,
    forgotPassword,
    resetPassword,
    initiateGoogleAuth,
    handleGoogleCallback,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

const router = express.Router();

// Validation rules
const registerValidation = [
    body('name', 'Name is required').not().isEmpty().trim(),
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password must be 6 or more characters').isLength({ min: 6 })
];

// New validation for OTP verification
const verifyOtpValidation = [
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('otp', 'OTP is required').not().isEmpty().isLength({ min: parseInt(process.env.OTP_LENGTH || '6'), max: parseInt(process.env.OTP_LENGTH || '6') }).isNumeric()
];

const loginValidation = [
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
    body('password', 'Password is required').exists()
];

const forgotPasswordValidation = [
    body('email', 'Please include a valid email').isEmail().normalizeEmail(),
];

const resetPasswordValidation = [
    // No need to validate token here (controller handles it)
    body('password', 'Password must be 6 or more characters').isLength({ min: 6 })
    // Optional: Add password confirmation validation if needed
    // body('passwordConfirm').custom((value, { req }) => { ... })
];

// Define routes
router.post('/register', registerValidation, registerUser);
router.post('/verify-otp', verifyOtpValidation, verifyOTP);
router.post('/login', loginValidation, loginUser);
router.get('/me', protect, getMe);
router.post('/logout', protect, logoutUser);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.get('/verify-reset-token/:token', verifyResetToken);
router.post('/reset-password', resetPasswordValidation, resetPassword);
router.get('/google', initiateGoogleAuth);
router.get('/google/callback', handleGoogleCallback);


module.exports = router;