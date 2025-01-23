const { default: mongoose, isValidObjectId } = require('mongoose');
const Conversation = require('../models/Conversation');
const { ObjectId } = mongoose.Types;

const updateConversation = async (req, res, next) => {
    const { message, participant } = req.body || {};
    const { conversationId } = req.params;
    const { userId } = req.user;

    // Check for valid fields value
    if (!message || !participant) {
        return next({
            status: 400,
            message: 'Missing message or participant',
        });
    } else if (!isValidObjectId(participant)) {
        return next({
            status: 400,
            message: "'participant' is not a valid ID",
        });
    } else if (conversationId && !isValidObjectId(conversationId)) {
        return next({
            status: 400,
            message: "'conversationId' is not a valid ID",
        });
    }

    const filter =
        req.method === 'PATCH' && conversationId
            ? { _id: new ObjectId(conversationId) }
            : {
                  participants: {
                      $all: [new ObjectId(userId), new ObjectId(participant)],
                  },
              };

    try {
        const doc = await Conversation.findOneAndReplace(
            filter,
            {
                participants: [new ObjectId(userId), new ObjectId(participant)],
                lastMessage: message,
            },
            {
                upsert: true,
                returnDocument: 'after',
            }
        );

        res.send({
            message: 'Conversation created successfully',
            data: doc,
        });
    } catch (error) {
        next({ error });
    }
};

module.exports = { updateConversation };
