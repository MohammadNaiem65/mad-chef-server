const mongoose = require('mongoose');

const paymentReceiptSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		username: String,
		email: String,
		title: {
			type: String,
			required: true,
			enum: ['student/pro-pkg', 'student/chef-support'],
		},
		transactionId: {
			type: String,
		},
		amount: {
			type: Number,
			required: true,
		},
		status: {
			type: String,
			required: true,
			enum: ['pending', 'succeeded', 'failed'],
		},
	},
	{ timestamps: true }
);

const PaymentReceipt = mongoose.model('PaymentReceipt', paymentReceiptSchema);

module.exports = PaymentReceipt;
