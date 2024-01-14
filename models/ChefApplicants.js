const mongoose = require('mongoose');

const chefApplicantsSchema = new mongoose.Schema({
	usersId: {
		type: mongoose.SchemaTypes.ObjectId,
		ref: 'User',
	},
	status: {
		type: String,
		enum: ['pending', 'accepted', 'rejected'],
		default: 'pending',
	},
});

const ChefApplicants = mongoose.model('ChefApplicants', chefApplicantsSchema);

module.exports = ChefApplicants;
