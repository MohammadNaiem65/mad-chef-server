const validateMongoDBId = require('../utility/validateMongoDBId');
const PaymentReceipt = require('../models/PaymentReceipt');

const stripe = require('stripe')(process.env.STRIPE_API_KEY);

async function createPaymentIntent(req, res) {
	const { amount } = req.body;
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

async function savePaymentReceipt(req, res) {
	const { userId, username, email, title, transactionId, amount } = req.body;

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
		});

		res.json({ msg: 'Successful', data: transactionReceipt });
	} catch (err) {
		res.status(500).json({ msg: 'An error occurred', data: err });
	}
}

module.exports = { createPaymentIntent, savePaymentReceipt };
