const { default: mongoose, isValidObjectId } = require('mongoose');
const Conversation = require('../models/Conversation');
const { ObjectId } = mongoose.Types;

// Get all conversations for a user
const getConversations = async (req, res, next) => {
    const {
        p,
        page = 1,
        l,
        limit = process.env.CONVERSATION_PER_PAGE,
    } = req.query;

    const _page = Math.max(0, parseInt(p || page) - 1);
    const _limit = Math.max(1, parseInt(l || limit));

    try {
        const userId = req.user.uid;

        const conversations = await Conversation.find({
            participants: { $in: [userId] },
        })
            .sort({ updatedAt: -1 })
            .skip(_page * _limit)
            .limit(_limit);

        res.send({
            data: conversations,
        });
    } catch (error) {
        next({ error });
        res.status(500).json({ error: error.message });
    }
};

// Update conversation
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

module.exports = { getConversations, updateConversation };
