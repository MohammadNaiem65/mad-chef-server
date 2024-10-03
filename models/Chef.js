const { default: mongoose } = require('mongoose');

const chefSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        emailVerified: {
            type: Boolean,
            required: true,
        },
        role: {
            type: String,
            default: 'chef',
        },
        img: String,
        bio: String,
        yearsOfExperience: Number,
        consultBookings: {
            type: [mongoose.SchemaTypes.ObjectId],
            ref: 'Consult',
        },
        recipes: {
            type: [mongoose.SchemaTypes.ObjectId],
            ref: 'Recipe',
        },
    },
    {
        timestamps: true,
    }
);

const Chef = mongoose.model('Chef', chefSchema);

module.exports = Chef;
