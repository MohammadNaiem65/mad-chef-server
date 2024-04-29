const { default: mongoose } = require('mongoose');

const likeSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'User',
		},
		recipeId: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'Recipe',
		},
	},
	{
		timestamps: true,
	}
);

const Like = mongoose.model('Like', likeSchema);
module.exports = Like;
