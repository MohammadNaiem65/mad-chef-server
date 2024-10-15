const mongoose = require('mongoose');

const chefReviewSchema = new mongoose.Schema(
    {
        chefId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Chef',
            required: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: [0, 'The rating must be between 0 and 5'],
            max: [5, 'The rating must be between 0 and 5'],
        },
        message: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

// Add a pre-save hook to check for duplicate entries
chefReviewSchema.pre('save', async function (next) {
    const existingReview = await this.constructor.findOne({
        studentId: this.studentId,
        chefId: this.chefId,
    });

    if (existingReview) {
        const error = new Error(
            'A review for this student and chef combination already exists.'
        );
        error.status = 400;
        return next(error);
    }

    next();
});

const ChefReview = mongoose.model('ChefReview', chefReviewSchema);

module.exports = ChefReview;
