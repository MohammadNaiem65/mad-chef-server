// external imports
const express = require('express');

// internal imports
const checkAuth = require('../middlewares/checkAuth');
const {
	getUser,
	applyToBeChef,
	promoteUserToChef,
} = require('../controllers/userController');

const router = express.Router();

router.get('/:id', checkAuth, getUser);

router.post('/:id/apply-to-be-chef', applyToBeChef);

module.exports = router;
