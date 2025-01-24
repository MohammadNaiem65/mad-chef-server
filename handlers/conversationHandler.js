const express = require('express');
const checkRoles = require('../middlewares/checkRoles');
const checkAuth = require('../middlewares/checkAuth');
const {
    updateConversation,
    getConversations,
} = require('../controllers/conversationController');

const router = express.Router();

router.use(checkAuth, checkRoles('student', 'chef'));

router.get('/', getConversations);
router.post('/conversation', updateConversation);
router.patch('/conversation/:conversationId', updateConversation);

module.exports = router;
