const User = require('../models/User');
const {generateToken,generateGAuthToken} = require('../utils/generateToken');
const asyncHandler = require('../middleware/asyncHandler');
const { validationResult } = require('express-validator');
const sendEmail = require('../utils/sendEmail'); // Import email utility
const { generateOTP, calculateExpiry } = require('../utils/otpUtils'); // Import OTP utility
const crypto = require('crypto');
const { getGoogleAuthUrl, getGoogleUserInfo } = require('../utils/googleAuth'); // Adjust path

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


const loginUser = asyncHandler(async (req, res, next) => {
    // Assuming validation is done before this via express-validator in routes
    const { email, password } = req.body;

    // Find user, select password, AND ensure they are verified
    // Original check:
    const user = await User.findOne({ email: email, isVerified: true }).select('+password');

    if (user && (await user.matchPassword(password))) {
        // Password matches: Generate token and send response
        const token = generateToken(user._id);

        // *** Important: Ensure this response matches frontend needs ***
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            // avatarUrl: user.avatarUrl, // Add any other essential fields needed immediately by frontend
            token: token,
        });
    } else if (await User.findOne({ email: email, isVerified: false })) {
        // Handle case where user exists but is not verified
        res.status(401);
        throw new Error('Account not verified. Please verify your email first.');
    } else {
        // Handle invalid email or password (covers user not found OR wrong password for verified user)
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

const forgotPassword = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Although we don't reveal if email exists, basic validation is fine
        res.status(400);
        throw new Error(`Validation failed: ${errors.array().map(e => e.msg).join(', ')}`);
    }

    const { email } = req.body;
    const user = await User.findOne({ email: email });

    // If user exists, generate token, save, and send email
    if (user) {
        // 1) Generate the random reset token (plain token)
        const resetToken = crypto.randomBytes(32).toString('hex');

        // 2) Hash the token and set to user model (store only hash in DB)
        user.passwordResetToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // 3) Set token expiry (e.g., 10 minutes)
        user.passwordResetTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes from now

        // Save the user with reset token info (disable validation if needed, though shouldn't be)
        await user.save({ validateBeforeSave: false });

        // 4) Create reset URL for the email (send *plain* token)
        // Adjust the base URL based on your frontend environment
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

        // 5) Send email
        const message = `You are receiving this email because you (or someone else) has requested the reset of a password for your account.\n\nPlease click on the following link, or paste it into your browser to complete the process within 10 minutes:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Riskinn - Password Reset Request',
                message: message,
            });
        } catch (err) {
            console.error('Password Reset Email Error:', err);
            // If email fails, clear the reset token fields to allow retry
            user.passwordResetToken = undefined;
            user.passwordResetTokenExpiry = undefined;
            await user.save({ validateBeforeSave: false });

            res.status(500);
            throw new Error('Email could not be sent. Please try again later.');
        }
    }
    // Important: Always send a success-like response, even if user not found
    // This prevents attackers from figuring out which emails are registered (email enumeration)
    res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
    });
});

const verifyResetToken = asyncHandler(async (req, res, next) => {
    // 1) Get token from URL params
    const plainToken = req.params.token;

    // 2) Hash the plain token received from URL
    const hashedToken = crypto
        .createHash('sha256')
        .update(plainToken)
        .digest('hex');

    // 3) Find user by hashed token and check expiry
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetTokenExpiry: { $gt: Date.now() } // Check if expiry date is greater than now
    });

    // 4) If token is valid and not expired
    if (user) {
        res.status(200).json({ success: true, valid: true, message: 'Token is valid.' });
    } else {
        // 5) If token invalid or expired
        res.status(400); // Bad request (or 404 Not Found)
        throw new Error('Password reset token is invalid or has expired.');
    }
});

const resetPassword = asyncHandler(async (req, res, next) => {
     const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400);
        throw new Error(`Validation failed: ${errors.array().map(e => e.msg).join(', ')}`);
    }

    // 1) Get plain token from URL params
    const { password, token } = req.body; // Get new password from body
    const plainToken = token;

    // 2) Hash the plain token from URL
    const hashedToken = crypto
        .createHash('sha256')
        .update(plainToken)
        .digest('hex');

    // 3) Find user by hashed token and check expiry
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetTokenExpiry: { $gt: Date.now() }
    }).select('+password'); // Select password field if needed by pre-save hook context, though not strictly necessary here

    // 4) If token invalid or expired
    if (!user) {
        res.status(400);
        throw new Error('Password reset token is invalid or has expired.');
    }

    // 5) Set the new password (pre-save hook will hash it)
    user.password = password;

    // 6) Clear the reset token fields
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpiry = undefined;

    // 7) The pre-save hook should also update passwordChangedAt automatically

    // 8) Save the updated user document
    await user.save();

    // Optional: Log the user in immediately? Usually not done.
    // const token = generateToken(user._id);

    // 9) Send success response
    res.status(200).json({ success: true, message: 'Password reset successful.' });

});

const initiateGoogleAuth = asyncHandler(async (req, res) => {
    const url = getGoogleAuthUrl();
    res.json({ url });
});

const handleGoogleCallback = asyncHandler(async (req, res) => {
    const code = req.query.code;
    // Define frontend URLs - Ensure these are set in your .env!
    const frontendLoginUrl = process.env.FRONTEND_LOGIN_URL || '/login';
    const frontendCallbackUrl = process.env.FRONTEND_AUTH_CALLBACK_URL; // e.g., http://localhost:3000/auth/callback

    // Check if required frontend redirect URL is configured
    if (!frontendCallbackUrl) {
        console.error("FATAL ERROR: FRONTEND_AUTH_CALLBACK_URL environment variable is not set!");
        // Redirect to a generic error page or login with a specific config error
        return res.redirect(`${frontendLoginUrl}?error=ConfigurationError`);
    }

    if (!code) {
        console.warn("Google callback missing 'code' parameter.");
        return res.redirect(`${frontendLoginUrl}?error=GoogleAuthNoCode`);
    }

    try {
        console.log("Received Google callback with code:", code); // Log: Received code

        // 1. Exchange code for tokens and get user info
        const googleUserInfo = await getGoogleUserInfo(code);
        console.log("Retrieved Google User Info:", googleUserInfo); // Log: Got user info

        if (!googleUserInfo || !googleUserInfo.email) {
            // This specific error might come from getGoogleUserInfo's catch block already logging
            throw new Error('Could not retrieve valid user information from Google.');
        }

        // 2. Find or create user in your database
        console.log("Finding or creating user for email:", googleUserInfo.email);
        let user = await User.findOne({ email: googleUserInfo.email });

        if (user) {
            console.log("Existing user found:", user._id);
            // User exists, update googleId if missing and provider mismatch
            if (!user.googleId) {
                user.googleId = googleUserInfo.googleId;
                console.log("Updated googleId for existing user.");
            }
            // Update provider if they previously used email
            if (user.authProvider !== 'google') {
                user.authProvider = 'google';
                console.log("Updated authProvider to 'google' for existing user.");
            }
             // Optionally update avatar if missing or different
             if (!user.avatarUrl && googleUserInfo.avatarUrl) {
                 user.avatarUrl = googleUserInfo.avatarUrl;
                 console.log("Updated avatarUrl for existing user.");
             }
             user.isVerified = true; // Google emails are verified
             user.lastLogin = Date.now();
             await user.save();
             console.log("Existing user updated successfully.");
        } else {
            console.log("User not found, creating new user...");
            // Create new user
            user = await User.create({
                googleId: googleUserInfo.googleId,
                name: googleUserInfo.name,
                email: googleUserInfo.email,
                avatarUrl: googleUserInfo.avatarUrl,
                authProvider: 'google',
                isVerified: true,
                role: 'student', // Default role
                lastLogin: Date.now(),
            });
            console.log("New user created:", user._id);
        }

        // Ensure we have a valid user object with an ID
        if (!user || !user._id) {
            throw new Error("User object is invalid after find/create operation.");
        }

        // 3. Generate your application's JWT
        console.log("Generating application token for user ID:", user._id);
        const appToken = generateGAuthToken(user._id);
        if (!appToken) {
             throw new Error("Failed to generate application token.");
        }
        console.log("Application token generated successfully.");

        // 4. Redirect user to your frontend callback page with the token
        const redirectUrl = `${frontendCallbackUrl}?token=${appToken}`;
        console.log(`Redirecting user to frontend callback: ${redirectUrl}`);
        res.redirect(redirectUrl);

    } catch (error) {
        // --- DETAILED ERROR LOGGING ---
        console.error('--- Google Callback Error ---');
        console.error('Timestamp:', new Date().toISOString());
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack); // Log the full stack trace
        if (error.response?.data) { // Log detailed error from Google if available
             console.error('Google API Error Response:', error.response.data);
        }
        // --- End Detailed Logging ---

        // Redirect back to frontend login with a generic error for the user
        res.redirect(`${frontendLoginUrl}?error=GoogleAuthFailed`);
    }
});

module.exports = {
    initiateGoogleAuth,
    handleGoogleCallback,
    registerUser,
    verifyOTP, 
    loginUser,
    getMe,
    logoutUser,
    forgotPassword,
    verifyResetToken,
    resetPassword,
};