const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        ingredients: {
            type: [String],
            required: true,
        },
        region: {
            type: String,
            enum: [
                'asia',
                'europe',
                'america',
                'latin america',
                'africa',
                'middle east',
            ],
            required: true,
        },
        method: {
            type: String,
            required: true,
            trim: true,
        },
        img: {
            type: String,
            required: true,
        },
        imgTitle: {
            type: String,
        },
        like: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ['pending', 'published', 'hidden', 'rejected'],
            required: true,
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
