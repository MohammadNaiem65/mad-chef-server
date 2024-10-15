const express = require('express');
const multer = require('multer');

// internal imports
const checkAuth = require('../middlewares/checkAuth');
const checkChef = require('../middlewares/checkChef');
const checkStudent = require('../middlewares/checkStudent');
const uploadImage = require('../middlewares/uploadImage');
const {
    getChef,
    getChefs,
    getChefReviews,
    createChefReview,
    updateChefData,
} = require('../controllers/chefController');

// create router instance
const router = express.Router();

// Multer setup
const upload = multer({ dest: '/tmp/uploads/' });

router.get('/', getChefs);
router.get(['/chef/:chefId', '/:chefId'], getChef);
router.get(
    ['/chef/:chefId/reviews', '/:chefId/reviews'],
    checkAuth,
    getChefReviews
);
router.post(
    ['/chef/:chefId/reviews', '/:chefId/reviews'],
    checkAuth,
    checkStudent,
    createChefReview
);
router.patch('/chef/update-data', checkAuth, checkChef, updateChefData);
router.post(
    '/chef/upload-profile-picture',
    checkAuth,
    checkChef,
    upload.single('profile-image'),
    uploadImage,
    updateChefData
);

module.exports = router;
