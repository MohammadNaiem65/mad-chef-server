const mongoose = require('mongoose');

const rolePromotionApplicantsSchema = new mongoose.Schema(
	{
		usersId: {
			type: mongoose.SchemaTypes.ObjectId,
			ref: 'User',
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

const RolePromotionApplicants = mongoose.model(
	'RolePromotionApplicants',
	rolePromotionApplicantsSchema
);

module.exports = RolePromotionApplicants;
