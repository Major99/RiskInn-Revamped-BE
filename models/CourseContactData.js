// models/CourseContactData.js
const mongoose = require('mongoose');

// Sub-schema for Key Highlights
const KeyHighlightSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String } // Storing icon name (e.g., "PiCalendarCheckBold")
}, { _id: false });

// Sub-schema for Curriculum Modules
const CurriculumModuleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    points: [{ type: String }]
}, { _id: false });

// Sub-schema for Detailed Curriculum Sections
const DetailedCurriculumSectionSchema = new mongoose.Schema({
    sectionTitle: { type: String, required: true },
    modules: [CurriculumModuleSchema]
}, { _id: false });

// Sub-schema for Instructor Profile
const InstructorProfileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    title: { type: String },
    avatarUrl: { type: String },
    bioPoints: [{ type: String }],
    quote: { type: String }
}, { _id: false });

// Sub-schema for Form Fields (for the contact form on this page)
const FormFieldSchema = new mongoose.Schema({
    name: { type: String, required: true },
    label: { type: String, required: true },
    fieldType: { // Renamed from 'type' to avoid conflict with Mongoose's type keyword
        type: String,
        required: true,
        enum: ['input', 'textarea', 'select', 'checkbox', 'radio', 'datepicker', 'timepicker', 'switch', 'imageUploader', 'attachmentUploader', 'lexicalEditor'] // Add other types your FormField component supports
    },
    inputType: { type: String }, // For <input type="text|email|tel|...">
    placeholder: { type: String },
    defaultValue: { type: mongoose.Schema.Types.Mixed },
    options: [{ // For select, checkbox, radio
        value: { type: String, required: true },
        label: { type: String, required: true }
    }],
    rules: { type: mongoose.Schema.Types.Mixed }, // For react-hook-form validation rules
    isInactive: { type: Boolean, default: false },
    rows: { type: Number } // For textarea
    // Add any other properties your FormField component might expect
}, { _id: false });


// Main Schema for Course Contact Page Data
const CourseContactDataSchema = new mongoose.Schema({
    courseId: { // This will be the unique identifier, like 'ibi-summer-bootcamp'
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    pageTitle: { type: String, required: true },
    courseTitle: { type: String, required: true },
    mentorInfo: { type: String },
    bannerTags: [{ type: String }],
    completionAwards: [{ type: String }],
    programOverview: { type: String, required: true },
    whoShouldExplore: [{ type: String }],
    keyHighlights: [KeyHighlightSchema],
    detailedCurriculum: [DetailedCurriculumSectionSchema],
    instructor: InstructorProfileSchema,
    contactInfo: { // Optional: if you want to store specific contact details for this program
        email: String,
        phoneWhatsapp: [String] // Array of phone numbers
    },
    brochureUrl: { type: String },
    contactFormSchema: [FormFieldSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true }); // Automatically manages createdAt and updatedAt

// Pre-save hook to update the `updatedAt` field
CourseContactDataSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('CourseContactData', CourseContactDataSchema);
