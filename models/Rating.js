const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
	recipeId: {
		type: mongoose.SchemaTypes.ObjectId,
		ref: 'Recipe',
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

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;
