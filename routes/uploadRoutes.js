// routes/uploadRoutes.js
const express = require('express');
const upload = require('../middleware/uploadMiddleware'); // Multer middleware
const { uploadFile } = require('../controllers/uploadController');
// Add auth middleware later if needed: const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/v1/upload
// Add 'protect' middleware before 'upload.single' if route needs authentication
router.post('/', upload.single('file'), uploadFile);
// 'file' should match the 'name' attribute of your file input field in the frontend form

module.exports = router;