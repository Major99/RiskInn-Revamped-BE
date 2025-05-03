const express = require('express');
const {
  getUserProfile,
  updateUserProfile,
  // Import admin user controllers when created
  // getAllUsers, getUserById, updateUser, deleteUser
} = require('../controllers/userController'); // Adjust path
const { protect, admin } = require('../middleware/authMiddleware'); // Adjust path

const router = express.Router();

// --- User Specific Routes (require login) ---
router.route('/me/profile')
    .get(protect, getUserProfile)     // Get logged-in user's profile
    .put(protect, updateUserProfile); // Update logged-in user's profile

// Add routes for /me/enrollments, /me/wishlist etc. here, all protected

// --- Admin User Routes (require login + admin role) ---
// Example:
// router.route('/')
//     .get(protect, admin, getAllUsers); // Admin gets list of users

// router.route('/:id')
//     .get(protect, admin, getUserById)      // Admin gets specific user
//     .put(protect, admin, updateUser)       // Admin updates specific user
//     .delete(protect, admin, deleteUser);   // Admin deletes specific user

module.exports = router;
