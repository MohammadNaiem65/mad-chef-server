const mongoose = require('mongoose');

const chefReviewSchema = new mongoose.Schema({
	chefId: {
		type: mongoose.SchemaTypes.ObjectId,
		ref: 'Chef',
		required: true,
	},
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User',
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
});

// indexing userId and chefId fields so that they always
chefReviewSchema.index({ userId: 1, chefId: 1 }, { unique: true });

const ChefReview = mongoose.model('ChefReview', chefReviewSchema);

module.exports = ChefReview;
