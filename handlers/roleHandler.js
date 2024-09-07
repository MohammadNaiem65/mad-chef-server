const express = require('express');

const checkAuth = require('../middlewares/checkAuth');
const checkAdmin = require('../middlewares/checkAdmin');
const {
    applyForPromotion,
    hasAppliedForPromotion,
    getRolePromotionApplications,
    getRolePromotionApplication,
    updatePromotionApplicationStatus,
    deletePromotionApplication,
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
router.patch(
    '/update-promotion-application-status',
    checkAuth,
    checkAdmin,
    updatePromotionApplicationStatus
);
router.delete(
    '/delete-promotion-application/:id',
    checkAuth,
    checkAdmin,
    deletePromotionApplication
);

module.exports = router;
