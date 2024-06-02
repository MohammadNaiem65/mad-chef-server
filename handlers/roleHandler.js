const express = require('express');

const checkAuth = require('../middlewares/checkAuth');
const {
	applyForPromotion,
	hasAppliedForPromotion,
} = require('../controllers/roleController');

const router = express.Router();

router.post('/apply-for-promotion', checkAuth, applyForPromotion);
router.get('/has-applied-for-promotion', checkAuth, hasAppliedForPromotion);

module.exports = router;
