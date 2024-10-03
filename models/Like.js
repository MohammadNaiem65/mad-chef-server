const { default: mongoose } = require('mongoose');

const likeSchema = new mongoose.Schema(
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

const Like = mongoose.model('Like', likeSchema);
module.exports = Like;
