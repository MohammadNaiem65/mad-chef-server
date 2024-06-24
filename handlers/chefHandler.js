const express = require('express');

// internal imports
const {
	getChef,
	getChefs,
	getChefReviews,
	createChefReview,
} = require('../controllers/chefController');
const checkAuth = require('../middlewares/checkAuth');
const checkChef = require('../middlewares/checkChef');
const checkStudent = require('../middlewares/checkStudent');

// create router instance
const router = express.Router();

router.get('/', getChefs);
router.get(['/chef/:chefId', '/:chefId'], getChef);
router.get(
	['/chef/:chefId/reviews', '/:chefId/reviews'],
	checkAuth,
	checkChef,
	getChefReviews
);
router.post(
	['/chef/:chefId/reviews', '/:chefId/reviews'],
	checkAuth,
	checkStudent,
	createChefReview
);

module.exports = router;
