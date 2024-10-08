const { default: mongoose } = require('mongoose');

const newsletterSubscriberSchema = new mongoose.Schema({
    userId: {
        type: mongoose.SchemaTypes.ObjectId,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
});

const NewsletterSubscriber = mongoose.model(
    'NewsletterSubscriber',
    newsletterSubscriberSchema
);
module.exports = NewsletterSubscriber;
