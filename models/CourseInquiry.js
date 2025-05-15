const mongoose = require('mongoose');

const SubmittedFieldSchema = new mongoose.Schema({
    fieldName: { // The 'name' attribute of the form field from the schema
        type: String,
        required: true
    },
    fieldLabel: { // The 'label' of the form field
        type: String,
        required: true
    },
    fieldValue: { // The actual value submitted by the user
        type: mongoose.Schema.Types.Mixed, // Allows for string, number, boolean, array (for multi-checkbox)
        required: true
    }
}, { _id: false }); // No separate _id for each submitted field

const CourseInquirySchema = new mongoose.Schema({
    courseContactPageId: { // To link back to the CourseContactData entry
        type: String, // Should match the 'courseId' from CourseContactDataSchema
        required: true,
        ref: 'CourseContactData', // Optional: if you want to create a reference
        index: true
    },
    formId: { // The ID of the form schema used for this submission (e.g., 'ibi-summer-bootcamp-contact')
        type: String,
        required: true,
        index: true
    },
    // Store dynamic form data as an array of key-value pairs
    // This provides more structure than a single Mixed object for easier querying if needed.
    submittedData: [SubmittedFieldSchema],
    submittedAt: {
        type: Date,
        default: Date.now
    },
    // Optional: Store user information if the user is logged in when submitting
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Assuming you have a User model
        required: false // Make it optional if anonymous submissions are allowed
    },
    // Optional: Store user's IP or other metadata for tracking/analytics
    metaData: {
        ipAddress: String,
        userAgent: String
        // Add other relevant metadata
    }
}, { timestamps: { createdAt: 'submittedAt', updatedAt: true } }); // Use submittedAt for createdAt

module.exports = mongoose.model('CourseInquiry', CourseInquirySchema);
