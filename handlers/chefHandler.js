const express = require('express');

// internal imports
const {
	getChef,
	getChefs,
	getChefReviews,
} = require('../controllers/chefController');
const checkAuth = require('../middlewares/checkAuth');
const checkChef = require('../middlewares/checkChef');

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

module.exports = router;
