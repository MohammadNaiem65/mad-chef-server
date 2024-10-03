const { default: mongoose } = require('mongoose');

const adminSchema = new mongoose.Schema(
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
        role: {
            type: String,
            default: 'admin',
        },
        img: String,
    },
    {
        timestamps: true,
    }
);

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
