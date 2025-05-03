const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const formFieldSchema = new Schema({
    _id: false, // No separate ID needed for subdocument array items usually
    name: { type: String, required: true, match: /^[a-zA-Z0-9_]+$/, trim: true }, // Unique within form, no spaces
    label: { type: String, required: true, trim: true },
    fieldType: { type: String, enum: ['input', 'textarea', 'select', 'checkbox', 'radio'], required: true },
    inputType: { type: String, enum: ['text', 'email', 'password', 'number', 'date', 'tel'] }, // Only if fieldType is 'input'
    placeholder: { type: String, trim: true },
    options: [{ // Only if fieldType is 'select', 'checkbox', 'radio'
        _id: false,
        value: { type: String, required: true },
        label: { type: String, required: true }
    }],
    validation: { // Store validation rules
        required: { type: Schema.Types.Mixed }, // Can be boolean or string message
        minLength: { value: Number, message: String },
        maxLength: { value: Number, message: String },
        pattern: { value: String, message: String }, // Store regex as string
        // Add other potential validations: min, max, validate (custom logic needs handling)
    },
    defaultValue: { type: Schema.Types.Mixed }
});

const formSchemaSchema = new Schema({
    formId: { type: String, required: true, unique: true, index: true }, // User-defined ID like 'contact_us'
    formName: { type: String, required: true, trim: true },
    formDescription: { type: String, trim: true },
    fields: [formFieldSchema],
    // Add metadata like createdBy, etc. if needed
}, { timestamps: true });

module.exports = mongoose.model('FormSchema', formSchemaSchema);
