const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
    {
        participants: [{ type: String }],
        lastMessage: String,
    },
    {
        timestamps: true,
    }
);

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
