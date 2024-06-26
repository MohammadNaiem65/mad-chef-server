// external imports
const express = require('express');

const {
	createPaymentIntent,
	getPaymentReceipts,
	savePaymentReceipt,
	deletePaymentReceipt,
} = require('../controllers/paymentController');
const checkAuth = require('../middlewares/checkAuth');

// create router instance
const router = express.Router();

router.post('/create-payment-intent', checkAuth, createPaymentIntent);
router.get('/payment-receipt', checkAuth, getPaymentReceipts);
router.post('/payment-receipt', checkAuth, savePaymentReceipt);
router.delete('/payment-receipt', checkAuth, deletePaymentReceipt);

module.exports = router;
