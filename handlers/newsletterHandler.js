const express = require('express');

const {
    subscribeToNewsletter,
} = require('../controllers/newsletterController');

const router = express.Router();

router.post('/subscribe', subscribeToNewsletter);

module.exports = router;
