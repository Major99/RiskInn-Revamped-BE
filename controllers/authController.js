// controllers/authController.js
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const asyncHandler = require('../middleware/asyncHandler');
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/sendEmail'); // Import email utility
const { generateOTP, calculateExpiry } = require('../utils/otpUtils'); // Import OTP utility

const registerUser = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400);
        throw new Error(`Validation failed: ${errors.array().map(e => e.msg).join(', ')}`);
    }

    const { name, email, password } = req.body;

    let user = await User.findOne({ email: email, isVerified: true });
    if (user) {
        res.status(400);
        throw new Error('Email is already registered and verified.');
    }

    user = await User.findOne({ email: email, isVerified: false });

    const otp = generateOTP();
    const otpExpires = calculateExpiry();

    if (user) {
        user.name = name; 
        user.password = password; 
        user.otp = otp;
        user.otpExpires = otpExpires;
    } else {
        user = new User({
            name,
            email,
            password,
            otp,
            otpExpires,
            isVerified: false,
        });
    }

    await user.save(); 

    const message = `Welcome to Riskinn! Your One-Time Password (OTP) for registration is: ${otp}\n\nThis OTP is valid for ${process.env.OTP_EXPIRES_IN_MINUTES || 10} minutes.\n\nIf you did not request this, please ignore this email.`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Riskinn - Verify Your Email Address',
            message: message,
        });

        res.status(200).json({ 
            success: true,
            message: `OTP sent successfully to ${user.email}. Please verify your account.`,
        });
    } catch (err) {
        console.error("Email sending failed:", err);
        user.otp = undefined; 
        user.otpExpires = undefined;
        await user.save({ validateBeforeSave: false }); 

        res.status(500);
        throw new Error('Email could not be sent. Please try again later.');
    }
});

const verifyOTP = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400);
         throw new Error(`Validation failed: ${errors.array().map(e => e.msg).join(', ')}`);
    }

    const { email, otp } = req.body;

    // 1. Find the user by email, ensuring OTP field is selected
    const user = await User.findOne({
        email: email,
        isVerified: false // Look for unverified users
    }).select('+otp +otpExpires'); // Explicitly select OTP fields

    if (!user) {
        res.status(400);
        throw new Error('User not found or already verified.');
    }

    // 2. Check if OTP is correct and not expired
    if (user.otp !== otp || user.otpExpires < Date.now()) {
        res.status(400);
        // Consider clearing OTP on failure after X attempts if implementing attempt limits
        throw new Error('Invalid or expired OTP.');
    }

    // 3. Verification successful - Update user
    user.isVerified = true;
    user.otp = undefined; // Clear OTP fields
    user.otpExpires = undefined;
    await user.save();

    // 4. Generate token for the now verified user
    const token = generateToken(user._id);

    // 5. Send success response with token and user details
    res.status(200).json({ // 200 OK as user is now fully registered and logged in
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        token: token,
    });
});


// --- Keep other controllers (loginUser, getMe, logoutUser) ---
// Note: loginUser should now check for 'isVerified: true'
const loginUser = asyncHandler(async (req, res, next) => {
    // ... (validation) ...
    const { email, password } = req.body;

    // Find user, select password, AND ensure they are verified
    const user = await User.findOne({ email: email, isVerified: true }).select('+password');

    if (user && (await user.matchPassword(password))) {
       // ... (generate token and send response) ...
        const token = generateToken(user._id);
        res.json({ /* ... user data ..., token */ });
    } else if (await User.findOne({ email: email, isVerified: false })) {
        // Handle case where user exists but is not verified
        res.status(401);
        throw new Error('Account not verified. Please verify your email first.');
    } else {
        // Handle invalid email or password
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

const getMe = asyncHandler(async (req, res, next) => {
    const user = req.user;
  
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        // Add other fields you want to return for 'me' endpoint
        profile: user.profile,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      });
    } else {
      res.status(404);
      throw new Error('User not found'); // Should ideally not happen if protect middleware works
    }
  });
  
  const logoutUser = asyncHandler(async (req, res) => {
      // For JWT, logout is typically handled client-side by deleting the token.
      // If using cookies, clear the cookie:
      // res.cookie('jwt', 'loggedout', {
      //     httpOnly: true,
      //     expires: new Date(0) // Expire immediately
      // });
  
      // Send a confirmation response
      res.status(200).json({ message: 'User logged out successfully' });
  });
  
module.exports = {
  registerUser,
  verifyOTP, // Add verifyOTP
  loginUser,
  getMe,
  logoutUser,
};