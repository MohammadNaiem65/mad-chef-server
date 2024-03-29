const express = require('express');

const checkAuth = require('../middlewares/checkAuth');
const { createConsultDoc } = require('../controllers/consultController');

const router = express.Router();

// endpoints
router.post(['/', '/consult'], createConsultDoc);

module.exports = router;
