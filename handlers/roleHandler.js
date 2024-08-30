const express = require('express');

const checkAuth = require('../middlewares/checkAuth');
const checkAdmin = require('../middlewares/checkAdmin');
const {
    applyForPromotion,
    hasAppliedForPromotion,
    getRolePromotionApplications,
    getRolePromotionApplication,
} = require('../controllers/roleController');

const router = express.Router();

router.post('/apply-for-promotion', checkAuth, applyForPromotion);
router.get('/has-applied-for-promotion', checkAuth, hasAppliedForPromotion);
router.get(
    '/role-promotion-application/:applicationId',
    checkAuth,
    checkAdmin,
    getRolePromotionApplication
);
router.get(
    '/role-promotion-applications',
    checkAuth,
    checkAdmin,
    getRolePromotionApplications
);

module.exports = router;
