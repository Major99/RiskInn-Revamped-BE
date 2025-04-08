// controllers/uploadController.js
const { Upload } = require("@aws-sdk/lib-storage");
const { v4: uuidv4 } = require('uuid');
const s3Client = require('../config/s3'); // Import the configured S3 client

const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  // Generate a unique filename
  const fileExtension = req.file.originalname.split('.').pop();
  const uniqueKey = `uploads/<span class="math-inline">\{uuidv4\(\)\}\.</span>{fileExtension}`; // Example path prefix

  try {
    const parallelUploads3 = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: uniqueKey,
        Body: req.file.buffer, // The file buffer from multer memory storage
        ContentType: req.file.mimetype,
        // ACL: 'public-read' // Optional: Uncomment if you want the file to be publicly accessible via URL
      },
      // Optional: part size, queue size, etc.
      // partSize: 1024 * 1024 * 5, // e.g., 5MB per part
      // leavePartsOnError: false, // optional manually handle dropped parts
    });

    parallelUploads3.on("httpUploadProgress", (progress) => {
       console.log("Upload progress:", progress); // Log progress (optional)
    });

    const result = await parallelUploads3.done();

    // Construct the URL (may vary based on region and bucket settings)
    const fileUrl = `https://<span class="math-inline">\{process\.env\.S3\_BUCKET\_NAME\}\.s3\.</span>{process.env.AWS_REGION}.amazonaws.com/${uniqueKey}`;

    console.log("Upload Successful", result);

    res.status(201).json({
      message: 'File uploaded successfully!',
      fileUrl: fileUrl, // Send the S3 URL back
      key: uniqueKey,   // Send the S3 key back
    });

  } catch (err) {
    console.error("S3 Upload Error:", err);
    res.status(500).json({ message: 'Error uploading file to S3.', error: err.message });
  }
};

module.exports = {
  uploadFile,
};