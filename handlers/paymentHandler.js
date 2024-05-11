// external imports
const express = require('express');

const {
	createPaymentIntent,
	savePaymentReceipt,
} = require('../controllers/paymentController');
const checkAuth = require('../middlewares/checkAuth');

// create router instance
const router = express.Router();

router.post('/create-payment-intent', checkAuth, createPaymentIntent);
router.post('/save-payment-receipt', checkAuth, savePaymentReceipt);

module.exports = router;
