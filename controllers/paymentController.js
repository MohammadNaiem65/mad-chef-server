const { default: mongoose } = require('mongoose');
const { ObjectId } = mongoose.Types;

const validateMongoDBId = require('../utility/validateMongoDBId');
const PaymentReceipt = require('../models/PaymentReceipt');
const { json } = require('express');

const stripe = require('stripe')(process.env.STRIPE_API_KEY);

async function createPaymentIntent(req, res) {
	const { amount } = req.body;

	if (typeof amount !== 'number') {
		return res.status(400).json({ msg: 'Amount must be a number' });
	}

	const finalAmount = parseFloat(amount.toFixed(2));

	try {
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
	} catch (err) {
		console.log(err);
		res.status(500).json({ msg: 'An error occurred', data: err });
	}
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
		if (filter === 'all') {
			pipeline = [
				{
					$match: {
						userId: new ObjectId(userId),
					},
				},
			];
		} else {
			pipeline = [
				{
					$match: {
						userId: new ObjectId(userId),
						status: filter,
					},
				},
			];
		}
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
	const { userId, username, email, pkg, transactionId, amount, status } =
		req.body;

	// Stop the execution if the userId exists and is invalid
	if (userId !== undefined && !validateMongoDBId(userId, res)) {
		return;
	}

	try {
		// Save the payment receipt to DB
		const transactionReceipt = await PaymentReceipt.create({
			userId,
			username,
			email,
			pkg,
			transactionId,
			amount,
			status,
		});

		res.json({ msg: 'Successful', data: transactionReceipt });
	} catch (err) {
		res.status(500).json({ msg: 'An error occurred', data: err });
	}
}

async function deletePaymentReceipt(req, res) {
	const { receiptId } = req.query;
	const { receiptIds } = req.body;

	// Stop the execution if the receiptId exists and is invalid
	if (receiptId !== undefined && !validateMongoDBId(receiptId, res)) {
		return;
	}

	let idsToDelete = [];

	// Decide the delete method
	if (receiptId) {
		idsToDelete = [receiptId];
	} else if (receiptIds?.length > 0) {
		idsToDelete = [...receiptIds];
	}

	try {
		// Delete the payment receipt from DB
		const result = await PaymentReceipt.deleteMany({
			_id: { $in: idsToDelete },
		});

		res.json({ msg: 'Successful', data: result });
	} catch (err) {
		res.status(500).json({ msg: 'An error occurred', data: err });
	}
}

module.exports = {
	createPaymentIntent,
	getPaymentReceipts,
	savePaymentReceipt,
	deletePaymentReceipt,
};
