// external imports
const express = require('express');

// internal imports
const { authenticate } = require('../controllers/authController');

// create router instance
const router = express.Router();

router.post('/', authenticate);
router.post('/test', (req, res) => {
	console.log('from test');
	console.log(req.headers);
	console.log(req.body);
});

module.exports = router;
