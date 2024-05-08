const stripe = require('stripe')(process.env.STRIPE_API_KEY);

async function createPaymentIntentForProPackage(req, res) {
	const paymentIntent = await stripe.paymentIntents.create({
		amount: 400,
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

module.exports = { createPaymentIntentForProPackage };
