// external imports
const express = require('express');

const {
	createPaymentIntentForProPackage,
} = require('../controllers/paymentController');
const checkAuth = require('../middlewares/checkAuth');

// create router instance
const router = express.Router();

router.get(
	'/user/pro/create-payment-intent',
	checkAuth,
	createPaymentIntentForProPackage
);

module.exports = router;
