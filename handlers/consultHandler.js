const express = require('express');

const checkAuth = require('../middlewares/checkAuth');
const {
	createConsultDoc,
	getConsults,
} = require('../controllers/consultController');

const router = express.Router();

// Endpoints
router.get('/user', checkAuth, getConsults);
router.post(['/consult', '/'], checkAuth, createConsultDoc);

module.exports = router;
