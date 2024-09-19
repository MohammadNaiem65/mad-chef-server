const { default: mongoose } = require('mongoose');
const { ObjectId } = mongoose.Types;

const validateMongoDBId = require('../utility/validateMongoDBId');
const PaymentReceipt = require('../models/PaymentReceipt');
const { json } = require('express');
const getCurrPage = require('../utility/getCurrPage');

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
    const {
        p,
        page = 0,
        l,
        limit = process.env.RECEIPTS_PER_PAGE,
        userId,
        filter,
    } = req.query;

    // Stop the execution if the userId exists and is invalid
    if (userId !== undefined && !validateMongoDBId(userId, res)) {
        return;
    }

    const _page = parseInt(p || page) - 1;
    const _limit = parseInt(l || limit) <= 0 ? 1 : parseInt(l || limit);

    // Create aggregation pipeline
    // let pipeline;
    let filterObj = {};

    if (userId) {
        filterObj.userId = new ObjectId(userId);
    } else if (filter !== 'all') {
        filterObj.status = filter;
    }

    const pipeline = [
        {
            $match: filterObj,
        },
        { $skip: (_page <= 0 ? 0 : _page) * _limit },
        { $limit: _limit },
    ];

    try {
        const paymentReceipts = await PaymentReceipt.aggregate(pipeline);

        const totalCount = await PaymentReceipt.countDocuments(filterObj);
        const currPage = getCurrPage(
            _page <= 0 ? 1 : _page + 1,
            _limit,
            totalCount
        );

        res.json({
            data: paymentReceipts,
            meta: {
                page: currPage,
                totalCount,
            },
        });
    } catch (err) {
        console.log(err);
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
