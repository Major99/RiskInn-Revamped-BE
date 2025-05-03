// models/ContactSubmission.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for contact form submissions
const contactSubmissionSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name is required'], // Make name required
        trim: true // Remove leading/trailing whitespace
    },
    email: {
        type: String,
        required: [true, 'Email is required'], // Make email required
        lowercase: true, // Store email in lowercase
        trim: true,
        // Basic email format validation
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    phone: {
        type: String,
        trim: true // Phone is optional
    },
    inquiryType: {
        type: String,
        trim: true // Inquiry type is optional
        // Optional: Add enum if you have predefined types from the dropdown
        // enum: ['course_inquiry', 'mentorship_inquiry', 'job_seeker', 'employer_partnership', 'support', 'other']
    },
    subject: {
        type: String,
        trim: true // Subject is optional
    },
    message: {
        type: String,
        required: [true, 'Message is required'], // Make message required
        trim: true
    },
    // Optional fields you might want to track:
    ipAddress: { // Store the IP address for potential auditing/tracking
        type: String
    },
    status: { // To track the status of the inquiry (e.g., for an admin dashboard)
        type: String,
        enum: ['New', 'Read', 'Replied', 'Archived'], // Example statuses
        default: 'New', // Default status when a new submission comes in
        index: true // Indexing status can be useful for filtering
    },
    submittedBy: { // Link to the User model if the submission was made by a logged-in user
        type: Schema.Types.ObjectId,
        ref: 'User', // Assumes you have a 'User' model
        index: true // Index for potential lookups
    }
}, {
    // Automatically add 'createdAt' and 'updatedAt' fields
    timestamps: true
});

// Export the Mongoose model
module.exports = mongoose.model('ContactSubmission', contactSubmissionSchema);
