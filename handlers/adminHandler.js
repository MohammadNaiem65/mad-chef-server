const express = require('express');
const Admin = require('../models/Admin');
const { getAuth } = require('firebase-admin/auth');
const checkAuth = require('../middlewares/checkAuth');
const checkAdmin = require('../middlewares/checkAdmin');
const { getAdminData } = require('../controllers/adminController');

const router = express.Router();

router.get(
	['/admin/:adminId', '/:adminId'],
	checkAuth,
	checkAdmin,
	getAdminData
);

module.exports = router;
