const express = require('express');
const multer = require('multer');

const checkAuth = require('../middlewares/checkAuth');
const checkAdmin = require('../middlewares/checkAdmin');
const uploadImage = require('../middlewares/uploadImage');
const {
    getAdminData,
    updateAdminData,
} = require('../controllers/adminController');

const router = express.Router();

// Multer setup
const upload = multer({ dest: '/tmp/uploads/' });

router.get(
    ['/admin/:adminId', '/:adminId'],
    checkAuth,
    checkAdmin,
    getAdminData
);
router.patch('/admin/update-data', checkAuth, checkAdmin, updateAdminData);
router.post(
    '/admin/upload-profile-picture',
    checkAuth,
    upload.single('profile-image'),
    uploadImage,
    updateAdminData
);

module.exports = router;
