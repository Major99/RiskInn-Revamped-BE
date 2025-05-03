const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const podcastSchema = new Schema({
    episodeNumber: { type: Number },
    title: { type: String, required: true, trim: true, index: true },
    description: { type: String },
    host: { type: String }, // Or Ref to TeamMember/User
    duration: { type: String },
    thumbnailUrl: { type: String },
    youtubeId: { type: String, unique: true, sparse: true, index: true },
    status: { type: String, enum: ['Draft', 'Published'], default: 'Published', index: true },
    publishedDate: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

module.exports = mongoose.model('Podcast', podcastSchema);
