// In some file, e.g., db.js or server.js
const mongoose = require('mongoose'); // Or: import mongoose from 'mongoose';

async function connectToMongoDB() { // <--- 'async' KEYWORD IS ADDED HERE
  console.log("Attempting to connect to MongoDB...");
  try {
    // ... other code ...
    await mongoose.connect(process.env.MONGODB_URI, {
      // Add recommended Mongoose options if not already present
      // useNewUrlParser: true, (No longer needed in Mongoose 6+)
      // useUnifiedTopology: true, (No longer needed in Mongoose 6+)
    });
    console.log("MongoDB connected successfully.");
  } catch (error) {
    // This console.error is for your Vercel logs
    console.error("MongoDB Connection Failure:", error.message); // More concise for logs
    // console.error(error); // You can log the full error object for more details during debugging
    process.exit(1); // Crucial: Exit if DB connection fails, Vercel will restart
  }
}

// How this function needs to be called:
// If it's at the top level of an ES module and you want to connect immediately:
// await connectToMongoDB(); // (Requires Node.js 14.8+ for top-level await in ES modules)

// Or, a more common pattern, especially if server.js is an ES module:
// (async () => {
//   await connectToMongoDB();
//   // Now start your server (app.listen, etc.)
//   // e.g., app.listen(process.env.PORT, () => console.log('Server started'));
// })();

// Or if you export it to be called from an async context in server.js:
// module.exports = connectToMongoDB; // For CommonJS
// export default connectToMongoDB; // For ES Modules