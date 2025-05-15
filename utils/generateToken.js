import jwt from 'jsonwebtoken';

export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId }, // Payload: typically contains user ID, maybe role
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

export const generateGAuthToken = (user) => {
  if (!user || !user._id) {
      console.error("Cannot generate token: Invalid user object provided.");
      // Handle error appropriately - maybe return null or throw
      return null;
  }

  // --- Define the payload ---
  // Include the fields you want accessible on the frontend after decoding
  const payload = {
    id: user._id, // Standard 'sub' claim often uses 'id' or '_id'
    name: user.name,
    email: user.email, // Be mindful of exposing email if not needed client-side directly from token
    role: user.role,
    avatarUrl: user.avatarUrl, // Optional: include avatar
    // Add other non-sensitive fields if necessary
  };

  // Sign the token
  return jwt.sign(
      payload, // <<< Use the payload object
      process.env.JWT_SECRET, // Your secret key
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '30d', // Use expiry from .env or default
      }
  );
};

