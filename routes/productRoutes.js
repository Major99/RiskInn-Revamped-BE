const express = require('express');
const {
    getProducts,
    getProductById,
    // Import review controllers when created
    // createProductReview, getReviewsForProduct
    // Import admin product controllers when created
    // createProduct, updateProduct, deleteProduct
} = require('../controllers/productController'); // Adjust path
const { protect, admin, instructor } = require('../middleware/authMiddleware'); // Adjust path

const router = express.Router();

// --- Public Product Routes ---
router.route('/')
    .get(getProducts); // List products with filters

router.route('/:idOrSlug') // Use a param that can be ID or Slug
    .get(getProductById); // Get single product details

// --- Product Review Routes ---
// Example:
// router.route('/:id/reviews')
//     .post(protect, createProductReview) // Logged-in users can post reviews
//     .get(getReviewsForProduct);         // Public can get reviews

// --- Admin Product Routes ---
// Example:
// router.route('/admin') // Maybe prefix admin routes differently
//     .post(protect, admin, createProduct); // Only admins can create

// router.route('/admin/:id')
//     .put(protect, admin, updateProduct)    // Only admins can update
//     .delete(protect, admin, deleteProduct); // Only admins can delete


module.exports = router;
