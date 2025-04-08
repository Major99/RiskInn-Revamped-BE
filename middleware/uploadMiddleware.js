// middleware/uploadMiddleware.js
const multer = require('multer');

// Configure Multer to use memory storage (we'll stream buffer to S3)
const storage = multer.memoryStorage();

// Optional: File type filtering
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') { // Example: Allow images and PDFs
    cb(null, true);
  } else {
    cb(new Error('Invalid file type! Only images and PDFs are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  // fileFilter: fileFilter, // Uncomment to enable filtering
  limits: { fileSize: 1024 * 1024 * 5 } // Example: 5MB file size limit
});

module.exports = upload;