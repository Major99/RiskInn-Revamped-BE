// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Make sure bcryptjs is used consistently

const Schema = mongoose.Schema;

// --- Sub-schema for Enrollments ---
const enrollmentSchema = new Schema({
    _id: false,
    course: {
        type: Schema.Types.ObjectId,
        ref: 'Product', // Assumes your product model is named 'Product'
        required: true
    },
    enrolledAt: { type: Date, default: Date.now },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    completedAt: { type: Date }
}, { timestamps: { createdAt: 'enrolledAt', updatedAt: false } });

// --- Sub-schema for Profile Details ---
const profileSchema = new Schema({
    _id: false,
    title: { type: String, trim: true },
    location: { type: String, trim: true },
    bio: { type: String, trim: true, maxlength: 1000 },
    credentials: [String],
    skills: [String],
    socials: {
        linkedin: { type: String, trim: true },
        twitter: { type: String, trim: true },
        website: { type: String, trim: true },
    }
});

// --- Main User Schema ---
const userSchema = new Schema({
    // --- Core Identity ---
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        // Note: Handling uniqueness with unverified users needs care.
        // A partial index is a good approach if storing unverified in the same collection.
        // unique: true, // Re-evaluate based on strategy (see index below)
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'],
        index: true
    },
    password: {
        type: String,
        // Make required based on authProvider
        required: function() { return this.authProvider === 'email'; },
        minlength: [6, 'Password must be at least 6 characters long'], // Keep minlength
        select: false
    },
    avatarUrl: { type: String, trim: true },
    role: {
        type: String,
        enum: ['student', 'mentor', 'instructor', 'admin', 'recruiter', 'superadmin'],
        default: 'student',
        required: true,
        index: true
    },

    // --- Authentication & Status ---
    authProvider: {
        type: String,
        enum: ['email', 'google', 'organization'], // Added 'organization'
        required: true,
        default: 'email'
    },
    googleId: { type: String, unique: true, sparse: true },
    organizationId: { type: String, sparse: true }, // For organizational SSO mapping
    isVerified: { // Email verification status
        type: Boolean,
        default: false,
        index: true
    },
    isActive: { // Allows admins to disable accounts
        type: Boolean,
        default: true,
        index: true
    },
    // Fields for OTP email verification flow
    otp: { type: String, select: false },
    otpExpires: { type: Date, select: false },
    // Fields for standard password reset flow (separate from OTP)
    passwordResetToken: { type: String, select: false },
    passwordResetTokenExpiry: { type: Date, select: false },
    // Track password changes for JWT security
    passwordChangedAt: { type: Date, select: false },
    lastLogin: { type: Date },

    // --- Profile Data ---
    profile: profileSchema, // Embed the profile sub-schema

    // --- Student/User Data ---
    enrollments: [enrollmentSchema],
    wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    sendOffers: { type: Boolean, default: false }, // Consent

    // --- Instructor/Mentor Data ---
    linkedTeamMember: {
         type: Schema.Types.ObjectId,
         ref: 'TeamMember', // Assumes a 'TeamMember' model exists
         sparse: true,
         unique: true
    },

}, { timestamps: true }); // Automatically adds createdAt and updatedAt

// --- Password Hashing Middleware ---
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password') || !this.password) return next(); // Check if password exists

  try {
    const salt = await bcrypt.genSalt(10); // Adjust salt rounds as needed (10-12)
    this.password = await bcrypt.hash(this.password, salt);

    // Update passwordChangedAt if password modified *and* not a new document
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000; // Subtract 1 sec to ensure token issued before this
    }
    next();
  } catch (error) {
    next(error); // Pass error to error handling middleware
  }
});

// --- Password Comparison Method ---
userSchema.methods.matchPassword = async function(candidatePassword) {
  // Need access to 'this.password' which might be selected: false
  // Find the user again with password selected if needed, or rely on Mongoose behavior
  // However, comparing directly should work if 'this.password' is populated correctly before calling
   if (!this.password) return false; // Handle cases with no password (e.g., Google signup)
   return await bcrypt.compare(candidatePassword, this.password);
};

// --- Check if Password Changed After Token Issued ---
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp; // True if password changed after token
  }
  // False means NOT changed
  return false;
};


// --- Indexing ---
// Partial unique index for email only if verified (adjust based on strategy)
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isVerified: true } });
// Add other indexes based on common queries
// userSchema.index({ role: 1, isActive: 1 }); // Example: Find active users by role


module.exports = mongoose.model('User', userSchema);