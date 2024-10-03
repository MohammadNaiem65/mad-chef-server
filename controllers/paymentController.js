const { default: mongoose } = require('mongoose');
const { ObjectId } = mongoose.Types;

const PaymentReceipt = require('../models/PaymentReceipt');
const validateMongoDBId = require('../utility/validateMongoDBId');
const getCurrPage = require('../utility/getCurrPage');

const stripe = require('stripe')(process.env.STRIPE_API_KEY);

async function createPaymentIntent(req, res) {
    const { amount } = req.body;

    if (typeof amount !== 'number') {
        return res.status(400).json({ message: 'Amount must be a number' });
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
        console.error('Error in createPaymentIntent:', err);
        res.status(500).json({
            message: 'Internal server error',
            error: err.message,
        });
    }
}

async function getPaymentReceipts(req, res) {
    const {
        p,
        page = 0,
        l,
        limit = process.env.RECEIPTS_PER_PAGE,
        studentId,
        filter,
    } = req.query;

    // Stop the execution if the studentId is invalid
    if (!validateMongoDBId(studentId, res)) {
        return;
    }

    const _page = parseInt(p || page) - 1;
    const _limit = parseInt(l || limit) <= 0 ? 1 : parseInt(l || limit);

    // Create aggregation pipeline
    let filterObj = {};

    if (studentId) {
        filterObj.studentId = new ObjectId(studentId);
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
        const [paymentReceipts, totalCount] = await Promise.all([
            PaymentReceipt.aggregate(pipeline),
            PaymentReceipt.countDocuments(filterObj),
        ]);

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
        console.error('Error in getChefReviews:', err);
        res.status(500).json({
            message: 'Internal server error',
            error: err.message,
        });
    }
}

async function savePaymentReceipt(req, res) {
    const { studentId, username, email, pkg, transactionId, amount, status } =
        req.body;

    // Stop the execution if the studentId is invalid
    if (!validateMongoDBId(studentId, res)) {
        return;
    }

    try {
        // Save the payment receipt to DB
        const transactionReceipt = await PaymentReceipt.create({
            studentId,
            username,
            email,
            pkg,
            transactionId,
            amount,
            status,
        });

        res.json({ message: 'Successful', data: transactionReceipt });
    } catch (err) {
        console.error('Error in savePaymentReceipt:', err);
        res.status(500).json({
            message: 'Internal server error',
            error: err.message,
        });
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

        res.json({
            message: 'Successfully deleted the payments receipts',
            data: result,
        });
    } catch (err) {
        console.error('Error in deletePaymentReceipt:', err);
        res.status(500).json({
            message: 'Internal server error',
            error: err.message,
        });
    }
}

module.exports = {
    createPaymentIntent,
    getPaymentReceipts,
    savePaymentReceipt,
    deletePaymentReceipt,
};
