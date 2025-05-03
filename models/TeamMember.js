const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const teamMemberSchema = new Schema({
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true },
    avatarUrl: { type: String },
    bio: { type: String },
    isMentor: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    stats: { courses: Number, students: String }, // Example stats
    socials: { linkedin: String, twitter: String },
    linkedUser: { type: Schema.Types.ObjectId, ref: 'User', sparse: true, unique: true },
    order: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('TeamMember', teamMemberSchema);
