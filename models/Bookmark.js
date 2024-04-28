const { default: mongoose } = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
	userId: {
		type: mongoose.SchemaTypes.ObjectId,
		ref: 'User',
	},
	recipeId: {
		type: mongoose.SchemaTypes.ObjectId,
		ref: 'Recipe',
	},
});

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
module.exports = Bookmark;
