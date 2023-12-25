const { Schema, default: mongoose } = require('mongoose');

const refreshTokenSchema = new Schema({
	userId: {
		type: mongoose.SchemaTypes.ObjectId,
		ref: 'User',
	},
	token: {
		type: String,
		required: true,
	},
});

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;
