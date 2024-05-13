const { default: mongoose } = require('mongoose');
const { ObjectId } = mongoose.Types;

const validateMongoDBId = require('../utility/validateMongoDBId');
const PaymentReceipt = require('../models/PaymentReceipt');

const stripe = require('stripe')(process.env.STRIPE_API_KEY);

async function createPaymentIntent(req, res) {
	const { amount } = req.body;

	if (typeof amount !== 'number') {
		return res.status(400).json({ msg: 'Amount must be a number' });
	}

	const finalAmount = parseFloat(amount.toFixed(2));

	const paymentIntent = await stripe.paymentIntents.create({
		amount: finalAmount,
		currency: 'USD',
		automatic_payment_methods: {
			enabled: true,
		},
	});

	res.send({
		message: 'Successful',
		data: { clientSecret: paymentIntent.client_secret },
	});
}

async function getPaymentReceipts(req, res) {
	const { userId, filter } = req.query;

	// Stop the execution if the userId exists and is invalid
	if (userId !== undefined && !validateMongoDBId(userId, res)) {
		return;
	}

	// Create aggregation pipeline
	let pipeline;

	if (userId && filter) {
		pipeline = [
			{
				$match: {
					userId: new ObjectId('6636632fe662b85104099c5d'),
					status: filter,
				},
			},
		];
	} else if (userId) {
		pipeline = [
			{
				$match: {
					userId: new ObjectId('6636632fe662b85104099c5d'),
				},
			},
		];
	} else if (filter) {
		pipeline = [
			{
				$match: {
					status: 'failed',
				},
			},
		];
	}

	try {
		const paymentReceipts = await PaymentReceipt.aggregate(pipeline);

		res.json({ msg: 'Successful', data: paymentReceipts });
	} catch (err) {
		res.status(500).json({ msg: 'An error occurred', data: err });
	}
}

async function savePaymentReceipt(req, res) {
	const { userId, username, email, title, transactionId, amount, status } =
		req.body;

	// Validate the userId
	validateMongoDBId(userId, res);

	try {
		// Save the payment receipt to DB
		const transactionReceipt = await PaymentReceipt.create({
			userId,
			username,
			email,
			title,
			transactionId,
			amount,
			status,
		});

		res.json({ msg: 'Successful', data: transactionReceipt });
	} catch (err) {
		res.status(500).json({ msg: 'An error occurred', data: err });
	}
}

module.exports = {
	createPaymentIntent,
	getPaymentReceipts,
	savePaymentReceipt,
};
