const mongoose = require('mongoose');
const NewsletterSubscriber = require('../models/NewsletterSubscriber');
const validateMongoDBId = require('../utility/validateMongoDBId');

async function subscribeToNewsletter(req, res) {
    const { email, userId } = req.body;

    // Check if email is provided
    if (!email) {
        return res.status(400).json({
            message: 'An email is required to subscribe to newsletter.',
        });
    }

    // Validate userId if provided
    if (userId && !validateMongoDBId(userId, res)) {
        return;
    }

    try {
        // Check if a subscription already exists with the given email or userId
        const existingSubscription = await NewsletterSubscriber.findOne({
            $or: [
                { email: email },
                ...(userId
                    ? [{ userId: new mongoose.Types.ObjectId(userId) }]
                    : []),
            ],
        });

        if (existingSubscription) {
            return res.status(409).json({
                message: 'You are already subscribed to the newsletter.',
            });
        }

        // Create new subscription
        const newSubscription = await NewsletterSubscriber.create({
            email,
            ...(userId ? { userId: new mongoose.Types.ObjectId(userId) } : {}),
        });

        res.status(201).json({
            message: 'Successfully subscribed to newsletter.',
            data: newSubscription,
        });
    } catch (error) {
        console.error('Error in subscribeToNewsletter:', error);
        res.status(500).json({
            message: 'An error occurred while subscribing to the newsletter.',
        });
    }
}

module.exports = { subscribeToNewsletter };
