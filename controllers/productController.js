const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Review = require('../models/Review'); // If handling reviews here
const User = require('../models/User'); // If needed

// @desc    Fetch all courses/products with filtering, sorting, pagination
// @route   GET /api/v1/courses
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
    const pageSize = parseInt(req.query.limit) || 10; // Items per page
    const page = parseInt(req.query.page) || 1; // Current page

    // Build Filter Object
    const filter = {};
    if (req.query.category) filter.categories = req.query.category;
    if (req.query.level && req.query.level !== 'All Levels') filter.level = req.query.level;
    if (req.query.tag) filter.tags = req.query.tag;
    if (req.query.priceType) filter['price.priceType'] = req.query.priceType;
    if (req.query.featured) filter.isFeatured = true;
    if (req.query.productType) filter.productType = req.query.productType;
    filter.status = 'Published'; // Only show published products by default

    // Search Filter (simple title search example)
    if (req.query.search) {
        filter.title = { $regex: req.query.search, $options: 'i' }; // Case-insensitive search
        // Or use text index: filter.$text = { $search: req.query.search };
    }

    // Build Sort Object
    let sort = {};
    switch (req.query.sortBy) {
        case 'rating': sort = { 'ratingSummary.average': -1 }; break; // Descending rating
        case 'price-asc': sort = { 'price.current': 1 }; break; // Ascending price
        case 'price-desc': sort = { 'price.current': -1 }; break; // Descending price
        case 'newest': sort = { createdAt: -1 }; break; // Newest first
        default: sort = { createdAt: -1 }; // Default sort
    }

    const count = await Product.countDocuments(filter); // Get total count matching filter
    const products = await Product.find(filter)
        .populate('instructors', 'name title avatarUrl') // Populate instructor details
        .sort(sort)
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.json({
        products,
        page,
        totalPages: Math.ceil(count / pageSize),
        totalCount: count,
    });
});

// @desc    Fetch single product by ID or Slug
// @route   GET /api/v1/courses/:idOrSlug
// @access  Public
const getProductById = asyncHandler(async (req, res) => {
    // Check if ID is a valid ObjectId, otherwise assume it's a slug
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.idOrSlug);
    const query = isObjectId ? { _id: req.params.idOrSlug } : { slug: req.params.idOrSlug };
    query.status = 'Published'; // Ensure only published are fetched publicly

    const product = await Product.findOne(query)
        .populate('instructors', 'name title avatarUrl bio socials'); // Populate more instructor details

    if (product) {
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

// --- TODO: Add controllers for ---
// - getReviewsForProduct (paginated)
// - createProductReview (requires auth, enrollment check)
// --- Admin Product Controllers ---
// - createProduct (admin)
// - updateProduct (admin)
// - deleteProduct (admin)

module.exports = {
    getProducts,
    getProductById,
};

