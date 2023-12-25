const mongoose = require('mongoose');

// create user schema
const userSchema = new mongoose.Schema(
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
			default: false,
		},
		role: {
			type: String,
			enum: ['admin', 'instructor', 'student'],
			default: 'student',
		},
		img: String,
	},
	{
		timestamps: true,
	}
);

// created user model
const User = mongoose.model('User', userSchema);

module.exports = User;
