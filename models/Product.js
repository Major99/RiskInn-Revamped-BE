const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const curriculumItemSchema = new Schema({
    _id: false,
    type: { type: String, enum: ['Lecture', 'Quiz', 'Assignment', 'SectionHeader'], required: true },
    title: { type: String, required: true, trim: true },
    duration: { type: String },
    isLocked: { type: Boolean, default: false },
    videoUrl: { type: String },
    content: { type: String },
    // quizRef: { type: Schema.Types.ObjectId, ref: 'Quiz' },
});

const curriculumSectionSchema = new Schema({
    _id: false,
    title: { type: String, required: true, trim: true },
    items: [curriculumItemSchema]
});

const productSchema = new Schema({
    title: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    productType: { type: String, enum: ['Course', 'Test Series', 'Training', 'Mentorship', 'Guided Prep', 'Mock Exam', 'Upcoming Course'], required: true, index: true },
    status: { type: String, enum: ['Draft', 'Published', 'Archived'], default: 'Draft', index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    shortDescription: { type: String, trim: true },
    longDescription: { type: String, trim: true },
    imageUrl: { type: String },
    videoUrl: { type: String },
    categories: [{ type: String, index: true }],
    tags: [{ type: String, index: true }],
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Expert', 'All Levels'], index: true },
    language: { type: String, default: 'English' },
    instructors: [{ type: Schema.Types.ObjectId, ref: 'TeamMember' }],
    price: {
        current: { type: Schema.Types.Mixed, required: true },
        original: { type: Number },
        currency: { type: String, default: 'INR', required: true },
        priceType: { type: String, enum: ['Free', 'Paid', 'Subscription', 'Upcoming'], index: true },
    },
    durationText: { type: String },
    metadata: {
        students: Number,
        lessons: Number,
        quizzes: Number,
        questions: Number,
        status: String,
    },
    learningOutcomes: [String],
    callouts: [String],
    curriculum: [curriculumSectionSchema],
    ratingSummary: {
        average: { type: Number, default: 0, index: true },
        totalRatings: { type: Number, default: 0 },
        distribution: { type: [Number], default: [0, 0, 0, 0, 0] },
    },
    totalEnrollments: { type: Number, default: 0, index: true },
    lastUpdated: { type: Date },
}, { timestamps: true });

productSchema.pre('save', function (next) {
    if (this.isModified('title')) {
        this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    // Also ensure priceType matches price.current
    if (this.price) {
        if (this.price.current === 'Free' || this.price.current === 0) {
            this.price.priceType = 'Free';
        } else if (typeof this.price.current === 'string' && this.price.current.toLowerCase() === 'coming soon') {
            this.price.priceType = 'Upcoming';
        } else if (typeof this.price.current === 'number' && this.price.current > 0) {
            this.price.priceType = 'Paid';
        }
        // Handle 'Subscription' logic if needed
    }
    next();
});

productSchema.index({ title: 'text', shortDescription: 'text', categories: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
