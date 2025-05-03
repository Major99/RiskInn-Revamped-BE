const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const jobSchema = new Schema({
    jobTitle: { type: String, required: true, trim: true, index: true },
    companyName: { type: String, required: true, trim: true },
    companyLogoUrl: { type: String },
    location: { type: String, required: true, index: true },
    employmentType: { type: String, enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Remote'], required: true, index: true },
    description: { type: String, required: true },
    skills: [{ type: String, index: true }],
    salary: { type: String }, // Keep flexible
    applyUrl: { type: String }, // Link to external application or internal form
    postedBy: { type: Schema.Types.ObjectId, ref: 'User' }, // Admin/Recruiter User ID
    isFeatured: { type: Boolean, default: false, index: true },
    status: { type: String, enum: ['Draft', 'Open', 'Closed', 'Archived'], default: 'Open', index: true },
    expiresAt: { type: Date, index: true },
}, { timestamps: true });

jobSchema.index({ jobTitle: 'text', companyName: 'text', description: 'text', skills: 'text' });

module.exports = mongoose.model('Job', jobSchema);
