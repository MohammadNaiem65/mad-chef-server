const { default: mongoose } = require('mongoose');

const bookmarkSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Student',
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

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
module.exports = Bookmark;
