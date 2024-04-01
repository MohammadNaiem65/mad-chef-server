const mongoose = require('mongoose');

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
		},
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
