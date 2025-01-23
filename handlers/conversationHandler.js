const express = require('express');
const Conversation = require('../models/Conversation');
const checkRoles = require('../middlewares/checkRoles');
const checkAuth = require('../middlewares/checkAuth');
const { updateConversation } = require('../controllers/conversationController');

const router = express.Router();

router.use(checkAuth, checkRoles('student', 'chef'));

router.get('/', async (req, res) => {
    try {
        const userId = req.user.uid;

        const conversations = await Conversation.find({
            participants: { $in: [userId] },
        });
        // .populate('lastMessage')
        // .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/conversation', updateConversation);
router.patch('/conversation/:conversationId', updateConversation);

module.exports = router;
