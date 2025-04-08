// config/s3.js
const { S3Client } = require('@aws-sdk/client-s3');

// Ensure your environment variables are loaded (e.g., via dotenv in server.js)
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

module.exports = s3Client;