const { default: mongoose } = require('mongoose');

const consultSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Student',
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    userEmail: {
        type: String,
        required: true,
    },
    chefId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Chef',
        required: true,
    },
    chefName: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    startTime: {
        type: String,
        required: true,
    },
    endTime: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: [
            'pending',
            'accepted',
            'rejected',
            'completed',
            'cancelled',
            'failed',
        ],
        required: true,
    },
    joinLink: {
        type: String,
        trim: true,
    },
});

const Consult = mongoose.model('Consult', consultSchema);

module.exports = Consult;
