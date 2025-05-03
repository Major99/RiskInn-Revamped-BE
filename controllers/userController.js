const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Product = require('../models/Product'); // If needed for wishlist/enrollment details

// @desc    Get user profile (logged in user)
// @route   GET /api/v1/users/me/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    // .populate('enrollments.course', 'title slug imageUrl') // Example population
    // .populate('wishlist', 'title slug imageUrl price'); // Example population
    ;

  if (user) {
    // Return more detailed profile info than /auth/me
    res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        profile: user.profile, // Send embedded profile data
        enrollments: user.enrollments,
        wishlist: user.wishlist,
        sendOffers: user.sendOffers,
        createdAt: user.createdAt,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user profile (logged in user)
// @route   PUT /api/v1/users/me/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    // Update basic fields
    user.name = req.body.name || user.name;
    // Don't update email here usually, requires verification flow
    // user.email = req.body.email || user.email;
    user.avatarUrl = req.body.avatarUrl || user.avatarUrl;
    user.sendOffers = req.body.sendOffers ?? user.sendOffers; // Handle boolean correctly

    // Update embedded profile fields
    if (req.body.profile) {
        user.profile = { ...user.profile.toObject(), ...req.body.profile }; // Merge updates
    }

    // Update password if provided
    if (req.body.password) {
        if (req.body.password.length < 8) { // Example validation
            res.status(400);
            throw new Error('Password must be at least 8 characters');
        }
        // Hashing is handled by pre-save middleware
        user.password = req.body.password;
    }

    const updatedUser = await user.save();

    // Return updated basic info + token (optional, depends on flow)
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatarUrl: updatedUser.avatarUrl,
      // token: generateToken(updatedUser._id), // Maybe re-issue token?
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// --- TODO: Add controllers for ---
// - getEnrollments
// - enrollInCourse
// - getWishlist
// - addToWishlist
// - removeFromWishlist
// - getQuizAttempts
// - getOrders
// --- Admin User Controllers ---
// - getAllUsers (admin)
// - getUserById (admin)
// - updateUser (admin)
// - deleteUser (admin)

module.exports = {
  getUserProfile,
  updateUserProfile,
};
