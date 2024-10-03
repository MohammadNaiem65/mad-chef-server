const mongoose = require('mongoose');

const rolePromotionApplicantSchema = new mongoose.Schema(
    {
        usersId: {
            type: mongoose.SchemaTypes.ObjectId,
        },
        role: {
            type: String,
            enum: ['chef', 'admin'],
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending',
        },
    },
    {
        timestamps: true,
    }
);

const RolePromotionApplicant = mongoose.model(
    'RolePromotionApplicant',
    rolePromotionApplicantSchema
);

module.exports = RolePromotionApplicant;
