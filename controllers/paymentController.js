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

module.exports = { createPaymentIntent };
