// external imports
const express = require('express');

// internal imports
const checkAuth = require('../middlewares/checkAuth');
const {
	getUser,
	applyToBeChef,
	handleUserRolePromotion,
} = require('../controllers/userController');

const router = express.Router();

router.get('/:id', checkAuth, getUser);

router.post('/:id/apply-to-be-chef', checkAuth, applyToBeChef);

router.post(
	'/:id/requests/:requestId/action',
	checkAuth,
	handleUserRolePromotion
);

module.exports = router;
