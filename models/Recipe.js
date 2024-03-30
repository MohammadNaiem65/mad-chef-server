const { default: mongoose } = require('mongoose');

const ratingSchema = new mongoose.Schema({
	userId: mongoose.Schema.Types.ObjectId,
	rate: Number,
});

const recipeSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
		},
		ingredients: {
			type: [String],
			required: true,
		},
		method: {
			type: String,
			required: true,
		},
		img: {
			type: String,
			required: true,
		},
		like: {
			type: Number,
			default: 0,
			required: true,
		},
		rating: [ratingSchema],
		author: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'Chef',
			required: true,
		},
	},
	{
		timestamps: true,
	}
);

const Recipe = mongoose.model('Recipe', recipeSchema);

module.exports = Recipe;
