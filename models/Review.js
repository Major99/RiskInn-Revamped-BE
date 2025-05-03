const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5, index: true },
    title: { type: String, trim: true },
    text: { type: String, trim: true, required: true },
    isApproved: { type: Boolean, default: true, index: true },
}, { timestamps: true });

reviewSchema.index({ product: 1, user: 1 }, { unique: true }); 

module.exports = mongoose.model('Review', reviewSchema);
