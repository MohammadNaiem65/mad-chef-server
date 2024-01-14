// external imports
const express = require('express');

// internal imports
const {
	authenticate,
	logout,
	reAuthenticate,
} = require('../controllers/authController');
const checkAuth = require('../middlewares/checkAuth');

// create router instance
const router = express.Router();

router.post('/', authenticate);
router.get('/refresh-token', reAuthenticate);
router.delete('/logout', checkAuth, logout);

module.exports = router;
