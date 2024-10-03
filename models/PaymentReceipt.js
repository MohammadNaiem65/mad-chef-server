const mongoose = require('mongoose');

const paymentReceiptSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Student',
            required: true,
        },
        username: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        },
        pkg: {
            type: String,
            required: true,
            enum: ['student/pro-pkg', 'student/chef-support'],
        },
        transactionId: {
            type: String,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            required: true,
            enum: ['pending', 'succeeded', 'failed'],
        },
    },
    { timestamps: true }
);

const PaymentReceipt = mongoose.model('PaymentReceipt', paymentReceiptSchema);

module.exports = PaymentReceipt;
