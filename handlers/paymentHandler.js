// external imports
const express = require('express');

const { createPaymentIntent } = require('../controllers/paymentController');
const checkAuth = require('../middlewares/checkAuth');

// create router instance
const router = express.Router();

router.post('/create-payment-intent', checkAuth, createPaymentIntent);

module.exports = router;
