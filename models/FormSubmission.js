const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const formSubmissionSchema = new Schema({
    formSchemaRef: { type: Schema.Types.ObjectId, ref: 'FormSchema', required: true, index: true },
    formData: { type: Schema.Types.Mixed, required: true }, // Store the submitted data object { fieldName: value, ... }
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', index: true }, // Optional: link to user if submitted while logged in
    ipAddress: { type: String }, // Optional: store IP for auditing
}, { timestamps: true });

module.exports = mongoose.model('FormSubmission', formSubmissionSchema);
